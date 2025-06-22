"""
Consume JSON alerts from Kafka, clean the HTML summary, enrich with
lat/lon + NER + weapon tags, activities, and store in a Neon/PostGIS table.
"""
import json
import os
import signal
import sys
import time
from datetime import datetime

import psycopg2
from confluent_kafka import Consumer, KafkaException
from dotenv import load_dotenv
from psycopg2 import OperationalError, InterfaceError

from geo_resolver import geocode_text            # spaCy + Nominatim helper
from text_utils import html_to_text              # HTML→plain converter


# Schema definition
DDL = """
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


SQL_INSERT = """
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


def ensure_schema(cur):
    """Ensure PostGIS extension and alerts table exist."""
    cur.execute(DDL)
    print("✅  Schema ensured.")


def reconnect_db(dsn):
    """Open a fresh DB connection (retrying until it succeeds)."""
    while True:
        try:
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            ensure_schema(cur)
            conn.commit()
            print("✅  Connected to database.")
            return conn, cur
        except Exception as e:
            print(f"❌  DB connect failed: {e!r}, retrying in 5s…")
            time.sleep(5)


def shutdown(consumer, cur, conn):
    """Cleanup on exit."""
    print("🛑  Shutting down…")
    consumer.close()
    cur.close()
    conn.close()
    print("✅  Shutdown complete.")
    sys.exit(0)


def main():
    load_dotenv()
    dsn = os.getenv("PG_DSN")
    topic = os.getenv("NEWS_TOPIC", "news-violence")

    # initial connect
    conn, cur = reconnect_db(dsn)

    # set up Kafka consumer
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

    # hook signals
    signal.signal(signal.SIGINT,  lambda *_: shutdown(consumer, cur, conn))
    signal.signal(signal.SIGTERM, lambda *_: shutdown(consumer, cur, conn))

    print(f"[{datetime.utcnow():%Y-%m-%d %H:%M:%S}] Listening on {topic}")

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            raise KafkaException(msg.error())

        record = json.loads(msg.value())
        clean_summary = html_to_text(record.get("summary") or "")
        full_text = f"{record.get('title','')} {clean_summary}"
        lon, lat, entities = geocode_text(full_text)

        db_params = {
            "id":            record.get("id"),
            "source":        record.get("source"),
            "title":         record.get("title"),
            "summary":       clean_summary,
            "published_at":  record.get("published"),
            "violence_score":record.get("violence_score"),
            "fetched_at":    record.get("fetched_at"),
            "lon":           lon,
            "lat":           lat,
            "entities":      json.dumps(entities),
            "activities":    record.get("activities") or [],
            "severity_band": record.get("severity_band"),
            "language":      record.get("language","en"),
            "image_url":     record.get("image_url"),
        }

        try:
            cur.execute(SQL_INSERT, db_params)
            conn.commit()
            consumer.commit(asynchronous=False)
            print(f"✅  Inserted alert ID: {db_params['id']}")
        except (OperationalError, InterfaceError) as db_err:
            # lost connection: reconnect and skip this record
            print(f"⚠️  DB connection lost: {db_err!r}")
            conn, cur = reconnect_db(dsn)
            continue
        except Exception as e:
            # other error: rollback and continue
            print(f"⚠️  Insert failed for {db_params['id']}: {e!r}", file=sys.stderr)
            try:
                conn.rollback()
            except InterfaceError:
                conn, cur = reconnect_db(dsn)
            continue


if __name__ == "__main__":
    main()
