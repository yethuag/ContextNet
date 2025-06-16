from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from models import db, User, RSSFeed, Article, Alert, ProcessingLog

bp = Blueprint('main', __name__)

# -----------------------------------------
# AUTHENTICATION ROUTES
# -----------------------------------------

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('main.dashboard'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return render_template('register.html')
        
        hashed_password = generate_password_hash(password)
        user = User(username=username, password=hashed_password)
        
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        return redirect(url_for('main.dashboard'))
    
    return render_template('register.html')

@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.login'))

# -----------------------------------------
# DASHBOARD ROUTES
# -----------------------------------------

@bp.route('/')
@bp.route('/dashboard')
@login_required
def dashboard():
    stats = {
        'total_alerts': Alert.query.count(),
        'active_feeds': RSSFeed.query.filter_by(is_active=True).count(),
        'recent_articles': Article.query.filter(
            Article.scraped_at >= datetime.utcnow() - timedelta(days=1)
        ).count(),
        'high_risk_alerts': Alert.query.filter(Alert.violence_score >= 0.8).count()
    }
    return render_template('dashboard.html', stats=stats)


# -----------------------------------------
# ALERTS API
# -----------------------------------------

@bp.route('/api/alerts')
@login_required
def api_alerts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    min_score = request.args.get('min_score', type=float)
    location = request.args.get('location')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = Alert.query.options(
        joinedload(Alert.article),
        joinedload(Alert.entities)
    )
    
    if min_score:
        query = query.filter(Alert.violence_score >= min_score)
    
    if location:
        query = query.filter(Alert.location_name.ilike(f'%{location}%'))
    
    if date_from:
        date_from = datetime.fromisoformat(date_from)
        query = query.filter(Alert.incident_date >= date_from)
    
    if date_to:
        date_to = datetime.fromisoformat(date_to)
        query = query.filter(Alert.incident_date <= date_to)
    
    query = query.order_by(Alert.created_at.desc())
    
    alerts = query.paginate(page=page, per_page=per_page, error_out=False)
    
    result = {
        'alerts': [{
            'id': alert.id,
            'title': alert.article.title,
            'violence_score': alert.violence_score,
            'location_name': alert.location_name,
            'incident_date': alert.incident_date.isoformat() if alert.incident_date else None,
            'created_at': alert.created_at.isoformat(),
            'severity_level': alert.severity_level,
            'geometry': {
                'lat': None,
                'lng': None
            } if not alert.geometry else {
                'lat': db.session.scalar(text(f"SELECT ST_Y(geometry) FROM alerts WHERE id = {alert.id}")),
                'lng': db.session.scalar(text(f"SELECT ST_X(geometry) FROM alerts WHERE id = {alert.id}"))
            },
            'entities': [{
                'text': entity.entity_text,
                'type': entity.entity_type,
                'confidence': entity.confidence_score
            } for entity in alert.entities]
        } for alert in alerts.items],
        'pagination': {
            'page': alerts.page,
            'pages': alerts.pages,
            'per_page': alerts.per_page,
            'total': alerts.total,
            'has_next': alerts.has_next,
            'has_prev': alerts.has_prev
        }
    }
    return jsonify(result)

@bp.route('/api/alerts/<int:alert_id>')
@login_required
def api_alert_detail(alert_id):
    alert = Alert.query.options(
        joinedload(Alert.article),
        joinedload(Alert.entities)
    ).get_or_404(alert_id)
    
    coordinates = None
    if alert.geometry:
        lat = db.session.scalar(text(f"SELECT ST_Y(geometry) FROM alerts WHERE id = {alert_id}"))
        lng = db.session.scalar(text(f"SELECT ST_X(geometry) FROM alerts WHERE id = {alert_id}"))
        coordinates = {'lat': lat, 'lng': lng}
    
    result = {
        'id': alert.id,
        'article': {
            'title': alert.article.title,
            'content': alert.article.content,
            'url': alert.article.url,
            'published_date': alert.article.published_date.isoformat() if alert.article.published_date else None
        },
        'violence_score': alert.violence_score,
        'classification_details': alert.classification_details,
        'location_name': alert.location_name,
        'coordinates': coordinates,
        'geocoding_confidence': alert.geocoding_confidence,
        'incident_date': alert.incident_date.isoformat() if alert.incident_date else None,
        'severity_level': alert.severity_level,
        'status': alert.status,
        'created_at': alert.created_at.isoformat(),
        'entities': [{
            'id': entity.id,
            'text': entity.entity_text,
            'type': entity.entity_type,
            'confidence': entity.confidence_score,
            'start_pos': entity.start_position,
            'end_pos': entity.end_position
        } for entity in alert.entities]
    }
    return jsonify(result)


# -----------------------------------------
# MAP DATA API ROUTES
# -----------------------------------------

@bp.route('/api/map/heatmap')
@login_required
def api_map_heatmap():
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    alerts = db.session.execute(text("""
        SELECT 
            id,
            ST_Y(geometry) as lat,
            ST_X(geometry) as lng,
            violence_score,
            severity_level,
            location_name
        FROM alerts 
        WHERE geometry IS NOT NULL 
        AND created_at >= :date_from
        ORDER BY violence_score DESC
    """), {'date_from': thirty_days_ago}).fetchall()
    
    heatmap_data = [{
        'id': alert.id,
        'lat': float(alert.lat),
        'lng': float(alert.lng),
        'intensity': float(alert.violence_score) if alert.violence_score else 0.5,
        'severity': alert.severity_level,
        'location': alert.location_name
    } for alert in alerts]
    
    return jsonify(heatmap_data)

@bp.route('/api/map/clusters')
@login_required
def api_map_clusters():
    clusters = db.session.execute(text("""
        SELECT 
            location_name,
            COUNT(*) as alert_count,
            AVG(violence_score) as avg_score,
            AVG(ST_Y(geometry)) as center_lat,
            AVG(ST_X(geometry)) as center_lng
        FROM alerts 
        WHERE geometry IS NOT NULL 
        AND location_name IS NOT NULL
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY location_name
        HAVING COUNT(*) > 1
        ORDER BY alert_count DESC
    """)).fetchall()
    
    cluster_data = [{
        'location': cluster.location_name,
        'count': cluster.alert_count,
        'avg_score': float(cluster.avg_score) if cluster.avg_score else 0,
        'center': {
            'lat': float(cluster.center_lat),
            'lng': float(cluster.center_lng)
        }
    } for cluster in clusters]
    
    return jsonify(cluster_data)


# -----------------------------------------
# RSS FEEDS MANAGEMENT
# -----------------------------------------

@bp.route('/api/rss-feeds')
@login_required
def api_rss_feeds():
    feeds = RSSFeed.query.all()
    return jsonify([{
        'id': feed.id,
        'name': feed.name,
        'url': feed.url,
        'is_active': feed.is_active,
        'last_scraped': feed.last_scraped.isoformat() if feed.last_scraped else None,
        'article_count': len(feed.articles)
    } for feed in feeds])

@bp.route('/api/rss-feeds', methods=['POST'])
@login_required
def api_create_rss_feed():
    data = request.get_json()
    
    feed = RSSFeed(
        name=data['name'],
        url=data['url'],
        is_active=data.get('is_active', True)
    )
    
    db.session.add(feed)
    db.session.commit()
    
    return jsonify({'id': feed.id, 'message': 'RSS feed created successfully'}), 201

@bp.route('/api/rss-feeds/<int:feed_id>', methods=['PUT'])
@login_required
def api_update_rss_feed(feed_id):
    feed = RSSFeed.query.get_or_404(feed_id)
    data = request.get_json()
    
    feed.name = data.get('name', feed.name)
    feed.url = data.get('url', feed.url)
    feed.is_active = data.get('is_active', feed.is_active)
    
    db.session.commit()
    
    return jsonify({'message': 'RSS feed updated successfully'})

@bp.route('/api/rss-feeds/<int:feed_id>', methods=['DELETE'])
@login_required
def api_delete_rss_feed(feed_id):
    feed = RSSFeed.query.get_or_404(feed_id)
    
    db.session.delete(feed)
    db.session.commit()
    
    return jsonify({'message': 'RSS feed deleted successfully'})


# -----------------------------------------
# ANALYTICS AND TRENDS
# -----------------------------------------

@bp.route('/api/analytics/trends')
@login_required
def api_analytics_trends():
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    daily_trends = db.session.execute(text("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as alert_count,
            AVG(violence_score) as avg_score
        FROM alerts 
        WHERE created_at >= :date_from
        GROUP BY DATE(created_at)
        ORDER BY date
    """), {'date_from': thirty_days_ago}).fetchall()
    
    entity_distribution = db.session.execute(text("""
        SELECT 
            entity_type,
            COUNT(*) as count
        FROM alert_entities ae
        JOIN alerts a ON ae.alert_id = a.id
        WHERE a.created_at >= :date_from
        GROUP BY entity_type
        ORDER BY count DESC
    """), {'date_from': thirty_days_ago}).fetchall()
    
    location_trends = db.session.execute(text("""
        SELECT 
            location_name,
            COUNT(*) as alert_count,
            AVG(violence_score) as avg_score
        FROM alerts 
        WHERE created_at >= :date_from
        AND location_name IS NOT NULL
        GROUP BY location_name
        ORDER BY alert_count DESC
        LIMIT 10
    """), {'date_from': thirty_days_ago}).fetchall()
    
    return jsonify({
        'daily_trends': [{
            'date': trend.date.isoformat(),
            'alert_count': trend.alert_count,
            'avg_score': float(trend.avg_score) if trend.avg_score else 0
        } for trend in daily_trends],
        'entity_distribution': [{
            'type': entity.entity_type,
            'count': entity.count
        } for entity in entity_distribution],
        'location_trends': [{
            'location': location.location_name,
            'alert_count': location.alert_count,
            'avg_score': float(location.avg_score) if location.avg_score else 0
        } for location in location_trends]
    })


# -----------------------------------------
# SYSTEM STATUS AND LOGS
# -----------------------------------------

@bp.route('/api/system/status')
@login_required
def api_system_status():
    recent_logs = ProcessingLog.query.order_by(
        ProcessingLog.started_at.desc()
    ).limit(50).all()
    
    stats = db.session.execute(text("""
        SELECT 
            stage,
            status,
            COUNT(*) as count
        FROM processing_logs
        WHERE started_at >= NOW() - INTERVAL '24 hours'
        GROUP BY stage, status
        ORDER BY stage, status
    """)).fetchall()
    
    return jsonify({
        'recent_logs': [{
            'id': log.id,
            'stage': log.stage,
            'status': log.status,
            'message': log.message,
            'processing_time': log.processing_time,
            'started_at': log.started_at.isoformat(),
            'completed_at': log.completed_at
        } for log in recent_logs],
        'stats': [{
            'stage': stat.stage,
            'status': stat.status,
            'count': stat.count
        } for stat in stats]
    })