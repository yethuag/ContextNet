#!/usr/bin/env python3
"""
Consume JSON alerts from Kafka, clean the HTML summary, enrich with
lat/lon + NER + weapon tags, activities, and store in a Neon/PostGIS table.
"""
import json
import os
import signal
import sys
from datetime import datetime

import psycopg2
from confluent_kafka import Consumer, KafkaException
from dotenv import load_dotenv

from geo_resolver import geocode_text            # spaCy + Nominatim helper
from text_utils import html_to_text              # HTML→plain converter


# Schema definition
DDL = (
    """
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS alerts (
  id             text PRIMARY KEY,
  source         text,
  title          text,
  summary        text,
  published_at   timestamptz,
  violence_score numeric,
  fetched_at     timestamptz,
  geom           geometry(Point,4326),
  entities       jsonb,
  activities     text[],
  severity_band  text,
  language       text,
  image_url      text
);
CREATE INDEX IF NOT EXISTS alerts_geom_idx
  ON alerts USING GIST (geom);
CREATE INDEX IF NOT EXISTS alerts_published_idx
  ON alerts (published_at);
"""
)


# Insert statement
SQL_INSERT = (
    """
INSERT INTO alerts(
  id, source, title, summary, published_at,
  violence_score, fetched_at, geom, entities,
  activities, severity_band, language, image_url
) VALUES (
  %(id)s, %(source)s, %(title)s, %(summary)s,
  %(published_at)s::timestamptz,
  %(violence_score)s, %(fetched_at)s::timestamptz,
  ST_SetSRID(ST_MakePoint(%(lon)s, %(lat)s),4326),
  %(entities)s::jsonb,
  %(activities)s,
  %(severity_band)s,
  %(language)s,
  %(image_url)s
)
ON CONFLICT (id) DO NOTHING;
"""
)


def ensure_schema(cursor):  # pylint: disable=invalid-name
    """
    Ensure PostGIS extension and alerts table exist.
    """
    cursor.execute(DDL)
    print("✅  Schema ensured.")


def shutdown(consumer, cursor, connection):  # pylint: disable=invalid-name
    """
    Cleanly shut down consumer and database connection.
    """
    print("Stopping...")
    consumer.close()
    cursor.close()
    connection.close()
    print("✅  Shutdown complete.")
    sys.exit(0)


def main():
    """
    Main loop: consume Kafka messages, process, and insert into DB.
    """
    load_dotenv()

    # Settings
    dsn = os.getenv("PG_DSN")
    topic = os.getenv("NEWS_TOPIC", "news-violence")

    # Kafka consumer config
    consumer_conf = {
        "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP"),
        "group.id": "violence-dashboard",
        "enable.auto.commit": False,
        "auto.offset.reset": "earliest",
        "security.protocol": "SASL_SSL",
        "sasl.mechanisms": "PLAIN",
        "sasl.username": os.getenv("KAFKA_API_KEY"),
        "sasl.password": os.getenv("KAFKA_API_SECRET"),
    }
    consumer = Consumer(consumer_conf)
    consumer.subscribe([topic])

    # Connect to Postgres
    connection = psycopg2.connect(dsn)
    cursor = connection.cursor()
    ensure_schema(cursor)
    connection.commit()

    # Signal handlers
    signal.signal(
        signal.SIGINT,
        lambda sig, frame: shutdown(consumer, cursor, connection),
    )
    signal.signal(
        signal.SIGTERM,
        lambda sig, frame: shutdown(consumer, cursor, connection),
    )

    print(f"[{datetime.utcnow():%Y-%m-%d %H:%M:%S}] Listening on {topic}")

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            raise KafkaException(msg.error())

        record = json.loads(msg.value())

        # Clean summary and prepare text
        clean_summary = html_to_text(record.get("summary") or "")
        record["summary"] = clean_summary
        full_text = f"{record.get('title', '')} {clean_summary}"

        # Geocode and NER
        lon, lat, entities = geocode_text(full_text)
        record["lon"] = lon
        record["lat"] = lat
        record["entities"] = json.dumps(entities)

        # Ensure activities field is present
        activities = record.get("activities") or []

        # Defaults
        record.setdefault("language", "en")
        record.setdefault("image_url", None)
        record.setdefault("severity_band", None)

        # Prepare parameters for DB insert
        db_params = {
            "id": record.get("id"),
            "source": record.get("source"),
            "title": record.get("title"),
            "summary": clean_summary,
            "published_at": record.get("published"),
            "violence_score": record.get("violence_score"),
            "fetched_at": record.get("fetched_at"),
            "lon": lon,
            "lat": lat,
            "entities": json.dumps(entities),
            "activities": activities,
            "severity_band": record.get("severity_band"),
            "language": record.get("language"),
            "image_url": record.get("image_url"),
        }

        try:
            cursor.execute(SQL_INSERT, db_params)
            connection.commit()
            consumer.commit(asynchronous=False)
            print(f"✅  Inserted alert ID: {db_params['id']}")
        except Exception as error:
            connection.rollback()
            print(
                f"⚠️  Insert failed for {db_params['id']}: {error}",
                file=sys.stderr,
            )


if __name__ == "__main__":
    main()
