import spacy
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from spacy.pipeline import EntityRuler
from pathlib import Path
import json
import time

# Build your spaCy pipeline (assuming you’ve fixed nlp_factory)
from nlp_factory import build_pipeline
NLP = build_pipeline()

# 1. Configure Nominatim with a clear user_agent and your email
geolocator = Nominatim(
    user_agent="nlp4safety_news_consumer/1.0 (wailyan.nw.4@gmail.com)",
    timeout=10
)

# 2. Wrap geocode in a RateLimiter: max 1 call per second, 3 retries on failure
geocode = RateLimiter(
    geolocator.geocode,
    min_delay_seconds=1,
    max_retries=2,
    error_wait_seconds=5.0
)

def geocode_text(text):
    """
    Extract GPE/LOC entities via spaCy NER, then geocode the first hit.
    Returns (lon, lat, ents_list).
    """
    doc = NLP(text)
    ents = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]

    for ent in doc.ents:
        if ent.label_ in ("GPE", "LOC"):
            try:
                loc = geocode(ent.text, addressdetails=False, language="en")
            except Exception as e:
                # log and skip on 403 or other errors
                print(f"⚠️ Geocoding failed for “{ent.text}”: {e}")
                return None, None, ents

            if loc:
                return loc.longitude, loc.latitude, ents

            # if no location found, try next entity
    return None, None, ents
