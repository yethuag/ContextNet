"""
FastAPI service exposing alerts data stored in Neon/Postgres.
Provides endpoints to list alerts (by published date), filter by date,
and return GeoJSON for mapping (by published date or last N days).
"""
import os
import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import Path
from sqlalchemy.types import Uuid
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, select, func, text
from sqlalchemy.orm import sessionmaker
from geoalchemy2.functions import ST_AsGeoJSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Text, DateTime, Numeric, JSON
from sqlalchemy import func
from dotenv import load_dotenv

# ─── Load environment & set up DB ─────────────────────────────────────────────
load_dotenv()
DATABASE_URL = os.getenv("PG_DSN")
if not DATABASE_URL:
    raise RuntimeError("PG_DSN must be set in .env")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()


# ─── ORM model for alerts ───────────────────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"
    id             = Column(Text, primary_key=True)
    new_id         = Column(Uuid(as_uuid=False), nullable=False)
    source         = Column(Text)
    title          = Column(Text)
    summary        = Column(Text)
    published_at   = Column(DateTime(timezone=True))
    violence_score = Column(Numeric)
    fetched_at     = Column(DateTime(timezone=True))
    geom           = Column(Text)    # store GEOJSON as text
    entities       = Column(JSON)
    activities     = Column(JSON)    # list of strings
    severity_band  = Column(Text)
    language       = Column(Text)
    image_url      = Column(Text)


# ─── Pydantic schema for output ────────────────────────────────────────────────
class AlertOut(BaseModel):
    id: str
    new_id: str 
    source: str
    title: str
    summary: str
    published_at: Optional[datetime] = None
    violence_score: float
    fetched_at: datetime
    entities: List[dict]
    activities: List[str]
    severity_band: Optional[str] = None
    language: str
    image_url: Optional[str]
    lon: Optional[float] = None
    lat: Optional[float] = None

    class Config:
        from_attributes = True


# ─── FastAPI application ───────────────────────────────────────────────────────
app = FastAPI(title="Alerts Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── DB dependency ──────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Endpoint: List alerts by published date ────────────────────────────────────
@app.get("/alerts", response_model=List[AlertOut])
def list_alerts(
    date: Optional[str] = Query(None, description="YYYY-MM-DD filter on published_at"),
    limit: int = Query(100, ge=1, le=1000),
    db=Depends(get_db),
):
    """
    List alerts, optionally filtered by the exact published date.
    """
    stmt = select(Alert)
    if date:
        try:
            dt = datetime.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
        next_day = dt + timedelta(days=1)
        stmt = stmt.where(
            Alert.published_at >= dt,
            Alert.published_at   < next_day
        )
    results = db.execute(stmt.order_by(Alert.published_at.desc()).limit(limit)).scalars().all()

    out = []
    for a in results:
        # extract lon/lat from stored geom
        lon = lat = None
        if a.geom:
            gj = db.execute(
                select(ST_AsGeoJSON(text("alerts.geom"))).where(Alert.id == a.id)
            ).scalar_one_or_none()
            if gj:
                coords = json.loads(gj).get("coordinates", [None, None])
                lon, lat = coords[0], coords[1]

        rec = AlertOut.from_orm(a).dict()
        rec.update({"lon": lon, "lat": lat})
        out.append(rec)
    return out

# @app.get("/alerts/{alert_id}", response_model=AlertOut)
# def get_alert(alert_id: str, db=Depends(get_db)):
#     """
#     Fetch a single alert by its ID.
#     """
#     a = db.execute(select(Alert).where(Alert.id == alert_id)).scalar_one_or_none()
#     if not a:
#         raise HTTPException(404, detail="Alert not found")
#     # extract lon/lat
#     lon = lat = None
#     if a.geom:
#         gj = db.execute(
#             select(ST_AsGeoJSON(text("alerts.geom"))).where(Alert.id == a.id)
#         ).scalar_one_or_none()
#         if gj:
#             c = json.loads(gj)["coordinates"]
#             lon, lat = c[0], c[1]
#     rec = AlertOut.from_orm(a).dict()
#     rec.update({"lon": lon, "lat": lat})
#     return rec


@app.get("/alerts/{new_id}", response_model=AlertOut)
def get_alert(new_id: str, db=Depends(get_db)):
    a = db.execute(select(Alert).where(Alert.new_id == new_id)).scalar_one_or_none()
    if not a:
        raise HTTPException(404, detail="Alert not found")
    lon = lat = None
    if a.geom:
        gj = db.execute(
            select(ST_AsGeoJSON(text("alerts.geom"))).where(Alert.id == a.id)
        ).scalar_one_or_none()
        if gj:
            c = json.loads(gj)["coordinates"]
            lon, lat = c[0], c[1]
    rec = AlertOut.from_orm(a).dict()
    rec.update({"lon": lon, "lat": lat}) 
    return rec

# ─── Endpoint: GeoJSON for map ─────────────────────────────────────────────────
@app.get("/map/geojson")
def alerts_geojson(
    days: int = Query(7, ge=1, le=365),
    date: Optional[str] = Query(None, description="YYYY-MM-DD filter on published_at"),
    db=Depends(get_db),
):
    """
    Return a GeoJSON FeatureCollection of alerts.
    - If `date` is provided, returns alerts published on that date.
    - Otherwise returns alerts fetched in the last `days`.
    """
    if date:
        try:
            dt = datetime.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
        next_day = dt + timedelta(days=1)
        where_clause = (Alert.published_at >= dt, Alert.published_at < next_day)
    else:
        cutoff = datetime.utcnow() - timedelta(days=days)
        where_clause = (Alert.fetched_at >= cutoff,)

    stmt = select(
        Alert.id,
        Alert.title,
        ST_AsGeoJSON(text("alerts.geom")).label("geojson")
    ).where(*where_clause)

    features = []
    for id_, title, gj in db.execute(stmt).all():
        if not gj:
            continue
        geom = json.loads(gj)
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {"id": id_, "title": title},
        })

    return {"type": "FeatureCollection", "features": features}


# ─── Stats endpoint ────────────────────────────────────────────────
@app.get("/stats/severity")
def severity_stats(db=Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=30)
    stmt = select(Alert.severity_band, func.count()).where(Alert.fetched_at >= cutoff).group_by(Alert.severity_band)
    rows = db.execute(stmt).all()
    return [{"severity_band": band, "count": cnt} for band, cnt in rows]

# 1. Counts per day for the last N days
@app.get("/stats/counts")
def daily_counts(days: int = Query(30, ge=1, le=365), db=Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    stmt = (
        select(
            func.to_char(Alert.published_at, 'YYYY-MM-DD').label("date"),
            func.count().label("count")
        )
        .where(Alert.published_at >= cutoff)
        .group_by(text("date"))
        .order_by(text("date"))
    )
    return [{"date": d, "count": c} for d, c in db.execute(stmt).all()]

# 2. Average violence_score per day
@app.get("/stats/avg_violence")
def avg_violence(days: int = Query(30, ge=1, le=365), db=Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    stmt = (
        select(
            func.to_char(Alert.published_at, 'YYYY-MM-DD').label("date"),
            func.avg(Alert.violence_score).label("avg_score")
        )
        .where(Alert.published_at >= cutoff)
        .group_by(text("date"))
        .order_by(text("date"))
    )
    return [{"date": d, "avg_score": float(c)} for d, c in db.execute(stmt).all()]

# 3. Activities stack per day
@app.get("/stats/activities")
def activities_by_day(days: int = Query(14, ge=1, le=365), db=Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    # unnest activities array and count per day + activity
    stmt = text("""
      SELECT to_char(published_at,'YYYY-MM-DD') AS date,
             activity,
             count(*) AS cnt
      FROM alerts, jsonb_array_elements_text(to_jsonb(activities)) AS activity
      WHERE published_at >= :cutoff
      GROUP BY date, activity
      ORDER BY date
    """)
    rows = db.execute(stmt, {"cutoff": cutoff}).all()
    # pivot into dict-of-dicts
    by_date = {}
    for date, act, cnt in rows:
        by_date.setdefault(date, {})[act] = cnt
    return [
      {"date": date, **by_date[date]}
      for date in sorted(by_date)
    ]

# 4. Top entities overall
@app.get("/stats/top_entities")
def top_entities(limit: int = Query(10, ge=1, le=100), db=Depends(get_db)):
    # unnest entities JSON array, group by text
    stmt = text("""
      SELECT elem->>'text' AS entity, count(*) AS cnt
      FROM alerts, jsonb_array_elements(entities) AS elem
      GROUP BY entity
      ORDER BY cnt DESC
      LIMIT :limit
    """)
    return [{"entity": e, "count": c} for e, c in db.execute(stmt, {"limit": limit})]

# ─── Ensure table exists on startup ────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
