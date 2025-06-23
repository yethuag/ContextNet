"""
Multi-activity news poller: classifies incoming RSS entries by violence
and tags them with one or more vulnerable-group activities, then publishes
to Kafka.
"""

import os
import re
import json
import time
from datetime import datetime

from dotenv import load_dotenv
import feedparser
from transformers import pipeline
from confluent_kafka import Producer


def get_severity_band(score: float) -> str:
    """
    Map a violence score (0–1) into a severity band.
    """
    if score < 0.6:
        return "info"
    if score < 0.7:
        return "low"
    if score < 0.85:
        return "medium"
    return "high"


def load_config() -> dict:
    load_dotenv() 

    rss_raw = os.getenv(
        "NEWS_RSS_URLS",
        "https://rss.cnn.com/rss/cnn_topstories.rss,"
        "https://www.aljazeera.com/xml/rss/all.xml"
    )
    rss_urls = [u.strip() for u in re.split(r"[,\n]+", rss_raw) if u.strip()]

    return {
        "rss_urls":          rss_urls,
        "poll_interval":     int(os.getenv("POLL_INTERVAL", "60")),
        "max_per_feed":      int(os.getenv("MAX_PER_FEED", "20")),
        "bootstrap_servers": os.getenv("KAFKA_BOOTSTRAP"),
        "api_key":           os.getenv("KAFKA_API_KEY"),
        "api_secret":        os.getenv("KAFKA_API_SECRET"),
        "topic":             os.getenv("NEWS_TOPIC", "news-violence"),
        "violence_thresh":   float(os.getenv("VIOLENCE_THRESHOLD", "0.6")),
        "activity_thresh":   float(os.getenv("ACTIVITY_THRESHOLD", "0.3")),
        "activity_labels": [
            a.strip() for a in os.getenv("NEWS_ACTIVITIES", "").split(",")
            if a.strip()
        ],
    }


def make_producer(bootstrap: str,
                  api_key: str,
                  api_secret: str) -> Producer:
    config = {
        "bootstrap.servers": bootstrap,
        "security.protocol": "SASL_SSL",
        "sasl.mechanisms":   "PLAIN",
        "sasl.username":     api_key,
        "sasl.password":     api_secret,
    }
    return Producer(config)


def make_classifiers() -> tuple:
    """
    Initialize and return zero-shot pipelines for violence and activities.
    """
    violence_clf = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli"
    )
    activity_clf = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli"
    )
    return violence_clf, activity_clf


def poll_and_produce(cfg: dict,
                     producer: Producer,
                     violence_clf,
                     activity_clf) -> None:
    """
    Continuously poll RSS feeds, classify entries, and send matching
    records to Kafka.
    """
    seen_ids = set()
    candidates_v = ["violent", "non-violent"]

    print(f"[{datetime.utcnow().isoformat()}] Starting poller; feeds="
          f"{cfg['rss_urls']}")

    while True:
        batch_count = 0

        for url in cfg["rss_urls"]:
            feed = feedparser.parse(url)
            source = feed.feed.get("title", url)

            for entry in feed.entries[: cfg["max_per_feed"]]:
                uid = entry.get("id") or entry.get("link")
                if not uid or uid in seen_ids:
                    continue

                title = (entry.get("title") or "").strip()
                summary = (entry.get("summary")
                           or entry.get("description")
                           or "").strip()
                text = f"{title} {summary}".strip()
                if not text:
                    continue

                # 1) Violence scoring
                snippet = text[:512]
                try:
                    res_v = violence_clf(snippet, candidates_v)
                    scores = dict(zip(res_v["labels"], res_v["scores"]))
                    v_score = scores.get("violent", 0.0)
                except Exception as exc:
                    print(f"⚠️ {source}: violence error → {exc}")
                    continue

                if v_score < cfg["violence_thresh"]:
                    continue

                # 2) Activity tagging
                try:
                    res_a = activity_clf(snippet, cfg["activity_labels"])
                    activities = [
                        lbl for lbl, sc in zip(res_a["labels"],
                                               res_a["scores"])
                        if sc >= cfg["activity_thresh"]
                    ]
                except Exception as exc:
                    print(f"⚠️ {source}: activity error → {exc}")
                    activities = []

                if not activities:
                    activities = ["other"]

                # 3) Build payload
                record = {
                    "id":              uid,
                    "source":          source,
                    "title":           title,
                    "summary":         summary,
                    "published":       entry.get("published"),
                    "violence_score":  round(v_score, 3),
                    "severity_band":   get_severity_band(v_score),
                    "activities":      activities,
                    "fetched_at":      datetime.utcnow().isoformat(),
                }

                # 4) Produce to Kafka
                producer.produce(
                    cfg["topic"],
                    json.dumps(record).encode("utf-8")
                )
                seen_ids.add(uid)
                batch_count += 1

        if batch_count:
            producer.flush()
            print(f"[{datetime.utcnow().isoformat()}] → Produced "
                  f"{batch_count} records to {cfg['topic']}")

        time.sleep(cfg["poll_interval"])


def main() -> None:
    """
    Entry point: load config, init components, and start polling loop.
    """
    cfg = load_config()
    producer = make_producer(cfg["bootstrap_servers"],
                             cfg["api_key"],
                             cfg["api_secret"])
    violence_clf, activity_clf = make_classifiers()

    try:
        poll_and_produce(cfg, producer, violence_clf, activity_clf)
    except KeyboardInterrupt:
        print("Shutting down on user interrupt")


if __name__ == "__main__":
    main()