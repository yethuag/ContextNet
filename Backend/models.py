from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
# Remove the geoalchemy2 import
# from geoalchemy2 import Geometry
import json

db = SQLAlchemy()

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

class RSSFeed(db.Model):
    __tablename__ = 'rss_feeds'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, default=True)
    last_scraped = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    articles = db.relationship('Article', backref='rss_feed', lazy=True)

class Article(db.Model):
    __tablename__ = 'articles'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text)
    url = db.Column(db.String(500), unique=True, nullable=False)
    published_date = db.Column(db.DateTime)
    scraped_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign key to RSSFeed
    rss_feed_id = db.Column(db.Integer, db.ForeignKey('rss_feeds.id'), nullable=False)
    
    # Processing status
    is_processed = db.Column(db.Boolean, default=False)
    processed_at = db.Column(db.DateTime)
    
    # Relationship to alerts
    alerts = db.relationship('Alert', backref='article', lazy=True)

class Alert(db.Model):
    """Main alerts table with coordinates, entities, and classification results"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Article reference
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), nullable=False)
    
    # Classification results
    violence_score = db.Column(db.Float)  # BART classification confidence
    is_violence_related = db.Column(db.Boolean, default=False)
    classification_details = db.Column(db.JSON)  # Store detailed BART results
    
    # Temporal information
    incident_date = db.Column(db.DateTime)  # Extracted incident date
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Spatial information (using separate lat/lng columns instead of PostGIS)
    latitude = db.Column(db.Float)  # WGS84 latitude
    longitude = db.Column(db.Float)  # WGS84 longitude
    location_name = db.Column(db.String(200))
    geocoding_confidence = db.Column(db.Float)
    
    # Status and metadata
    status = db.Column(db.String(50), default='active')  # active, archived, false_positive
    severity_level = db.Column(db.String(20))  # low, medium, high, critical
    
    # Relationships
    entities = db.relationship('AlertEntity', backref='alert', lazy=True, cascade='all, delete-orphan')
    
    def to_geojson_point(self):
        """Convert lat/lng to GeoJSON point format"""
        if self.latitude is not None and self.longitude is not None:
            return {
                "type": "Point",
                "coordinates": [self.longitude, self.latitude]
            }
        return None

class AlertEntity(db.Model):
    """Named entities extracted from alerts (people, places, weapons, etc.)"""
    __tablename__ = 'alert_entities'
    
    id = db.Column(db.Integer, primary_key=True)
    alert_id = db.Column(db.Integer, db.ForeignKey('alerts.id'), nullable=False)
    
    # Entity information
    entity_text = db.Column(db.String(200), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # PERSON, PLACE, WEAPON, ORG, etc.
    confidence_score = db.Column(db.Float)
    start_position = db.Column(db.Integer)  # Character position in text
    end_position = db.Column(db.Integer)
    
    # Additional metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ProcessingLog(db.Model):
    """Logs for tracking processing pipeline status"""
    __tablename__ = 'processing_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'))
    
    # Processing stage
    stage = db.Column(db.String(50), nullable=False)  # scraping, classification, ner, geocoding
    status = db.Column(db.String(20), nullable=False)  # success, failed, processing
    
    # Details
    message = db.Column(db.Text)
    error_details = db.Column(db.JSON)
    processing_time = db.Column(db.Float)  # seconds
    
    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

# Utility functions for JSON serialization
class AlertEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Create indexes for better performance
def create_indexes():
    """Create additional indexes for better query performance"""
    from sqlalchemy import text
    
    with db.engine.connect() as conn:
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_alerts_lat_lng ON alerts (latitude, longitude);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_alerts_incident_date ON alerts (incident_date);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_alerts_violence_score ON alerts (violence_score);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles (published_date);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_alert_entities_type ON alert_entities (entity_type);
        """))
        conn.commit()