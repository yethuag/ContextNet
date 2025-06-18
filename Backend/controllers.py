from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, distinct
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from models import db, User, Article, Alert, ProcessingLog, AlertEntity, RSSFeed

bp = Blueprint('main', __name__)

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
    try:
        stats = {
            'total_alerts': Alert.query.count(),
            'recent_articles': Article.query.filter(
                Article.scraped_at >= datetime.utcnow() - timedelta(days=1)
            ).count(),
            'high_risk_alerts': Alert.query.filter(Alert.violence_score >= 0.8).count(),
            'active_topics': db.session.query(func.count(distinct(Alert.location_name))).filter(
                Alert.created_at >= datetime.utcnow() - timedelta(days=7),
                Alert.location_name.isnot(None)
            ).scalar() or 0
        }
    except Exception as e:
        print(f"Dashboard stats error: {e}")
        stats = {
            'total_alerts': 0,
            'recent_articles': 0,
            'high_risk_alerts': 0,
            'active_topics': 0
        }
    
    return render_template('dashboard.html', stats=stats)

# -----------------------------------------
# RSS FEEDS API
# -----------------------------------------

@bp.route('/api/rss-feeds')
@login_required
def api_rss_feeds():
    feeds = RSSFeed.query.all()
    
    result = [{
        'id': feed.id,
        'name': feed.name,
        'url': feed.url,
        'is_active': feed.is_active,
        'last_scraped': feed.last_scraped.isoformat() if feed.last_scraped else None,
        'created_at': feed.created_at.isoformat(),
        'article_count': len(feed.articles)
    } for feed in feeds]
    
    return jsonify(result)

@bp.route('/api/alerts')
@login_required
def api_alerts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    min_score = request.args.get('min_score', type=float)
    location = request.args.get('location')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    topic = request.args.get('topic')
    
    try:
        query = Alert.query.options(
            joinedload(Alert.article),
            joinedload(Alert.entities)
        )
        
        if min_score:
            query = query.filter(Alert.violence_score >= min_score)
        
        if location:
            query = query.filter(Alert.location_name.ilike(f'%{location}%'))
        
        if topic:
            # Filter by topic - check if classification_details contains the topic
            query = query.filter(Alert.classification_details.op('::text').ilike(f'%{topic}%'))
        
        if date_from:
            try:
                date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Alert.incident_date >= date_from)
            except ValueError:
                pass  # Invalid date format, skip filter
        
        if date_to:
            try:
                date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Alert.incident_date <= date_to)
            except ValueError:
                pass  # Invalid date format, skip filter
        
        query = query.order_by(Alert.created_at.desc())
        
        alerts = query.paginate(
            page=page, 
            per_page=min(per_page, 100), 
            error_out=False
        )
        
        result = {
            'alerts': [{
                'id': alert.id,
                'title': alert.article.title,
                'violence_score': alert.violence_score,
                'location_name': alert.location_name,
                'incident_date': alert.incident_date.isoformat() if alert.incident_date else None,
                'created_at': alert.created_at.isoformat(),
                'severity_level': alert.severity_level,
                'classification_details': alert.classification_details,
                'geometry': {
                    'lat': alert.latitude,
                    'lng': alert.longitude
                } if alert.latitude and alert.longitude else None,
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
        
    except Exception as e:
        print(f"API alerts error: {e}")
        return jsonify({'error': 'Failed to fetch alerts', 'alerts': [], 'pagination': {}}), 500

@bp.route('/api/alerts/<int:alert_id>')
@login_required
def api_alert_detail(alert_id):
    try:
        alert = Alert.query.options(
            joinedload(Alert.article),
            joinedload(Alert.entities)
        ).get_or_404(alert_id)
        
        coordinates = None
        if alert.latitude and alert.longitude:
            coordinates = {'lat': alert.latitude, 'lng': alert.longitude}
        
        result = {
            'id': alert.id,
            'article': {
                'title': alert.article.title,
                'content': alert.article.content,
                'url': alert.article.url,
                'published_date': alert.article.published_date.isoformat() if alert.article.published_date else None,
                'source': alert.article.source_url
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
        
    except Exception as e:
        print(f"API alert detail error: {e}")
        return jsonify({'error': 'Failed to fetch alert details'}), 500

@bp.route('/api/topics')
@login_required
def api_topics():
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
        topics_query = db.session.query(
            func.case([
                (Alert.classification_details.op('::text').ilike('%bullying%'), 'Bullying'),
                (Alert.classification_details.op('::text').ilike('%discrimination%'), 'Discrimination'),
                (Alert.classification_details.op('::text').ilike('%lgbtq%'), 'LGBTQ+'),
                (Alert.classification_details.op('::text').ilike('%violence%'), 'Violence'),
                (Alert.classification_details.op('::text').ilike('%harassment%'), 'Harassment')
            ], else_='Other').label('topic'),
            func.count('*').label('count'),
            func.avg(Alert.violence_score).label('avg_score'),
            func.max(Alert.created_at).label('latest_incident')
        ).filter(
            Alert.created_at >= thirty_days_ago,
            Alert.classification_details.isnot(None)
        ).group_by('topic').having(func.count('*') > 0).order_by(func.count('*').desc())
        
        topics = topics_query.all()
        
        return jsonify([{
            'topic': topic.topic,
            'count': topic.count,
            'avg_score': float(topic.avg_score) if topic.avg_score else 0,
            'latest_incident': topic.latest_incident.isoformat() if topic.latest_incident else None
        } for topic in topics])
        
    except Exception as e:
        print(f"API topics error: {e}")
        return jsonify([])

@bp.route('/api/topics/<topic>/details')
@login_required
def api_topic_details(topic):
    try:
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_alerts = db.session.query(Alert, Article).join(Article).filter(
            Alert.classification_details.op('::text').ilike(f'%{topic.lower()}%'),
            Alert.created_at >= seven_days_ago
        ).order_by(Alert.created_at.desc()).limit(10).all()
        
        entities = db.session.query(
            AlertEntity.entity_text,
            AlertEntity.entity_type,
            func.count('*').label('frequency'),
            func.avg(AlertEntity.confidence_score).label('avg_confidence')
        ).join(Alert).filter(
            Alert.classification_details.op('::text').ilike(f'%{topic.lower()}%'),
            Alert.created_at >= seven_days_ago
        ).group_by(AlertEntity.entity_text, AlertEntity.entity_type).order_by(
            func.count('*').desc()
        ).limit(20).all()
        
        return jsonify({
            'topic': topic,
            'recent_alerts': [{
                'id': alert.Alert.id,
                'title': alert.Article.title,
                'violence_score': float(alert.Alert.violence_score) if alert.Alert.violence_score else 0,
                'location': alert.Alert.location_name,
                'created_at': alert.Alert.created_at.isoformat(),
                'severity': alert.Alert.severity_level,
                'source': alert.Article.source_url
            } for alert in recent_alerts],
            'entities': [{
                'text': entity.entity_text,
                'type': entity.entity_type,
                'frequency': entity.frequency,
                'confidence': float(entity.avg_confidence) if entity.avg_confidence else 0
            } for entity in entities]
        })
        
    except Exception as e:
        print(f"API topic details error: {e}")
        return jsonify({'topic': topic, 'recent_alerts': [], 'entities': []})

# -----------------------------------------
# MAP DATA API ROUTES
# -----------------------------------------

@bp.route('/api/map/heatmap')
@login_required
def api_map_heatmap():
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        alerts = Alert.query.filter(
            Alert.latitude.isnot(None),
            Alert.longitude.isnot(None),
            Alert.created_at >= thirty_days_ago
        ).order_by(Alert.violence_score.desc()).limit(1000).all()  # Limit for performance
        
        heatmap_data = [{
            'id': alert.id,
            'lat': float(alert.latitude),
            'lng': float(alert.longitude),
            'intensity': float(alert.violence_score) if alert.violence_score else 0.5,
            'severity': alert.severity_level,
            'location': alert.location_name,
            'topic': str(alert.classification_details) if alert.classification_details else 'Unknown'
        } for alert in alerts]
        
        return jsonify(heatmap_data)
        
    except Exception as e:
        print(f"API heatmap error: {e}")
        return jsonify([])

@bp.route('/api/map/clusters')
@login_required
def api_map_clusters():
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Use string aggregation compatible with SQLite and PostgreSQL
        clusters = db.session.query(
            Alert.location_name,
            func.count('*').label('alert_count'),
            func.avg(Alert.violence_score).label('avg_score'),
            func.avg(Alert.latitude).label('center_lat'),
            func.avg(Alert.longitude).label('center_lng'),
            func.max(Alert.classification_details).label('sample_topic')  # Get one sample topic
        ).filter(
            Alert.latitude.isnot(None),
            Alert.longitude.isnot(None),
            Alert.location_name.isnot(None),
            Alert.created_at >= thirty_days_ago
        ).group_by(Alert.location_name).having(
            func.count('*') > 1
        ).order_by(func.count('*').desc()).limit(50).all()  # Limit for performance
        
        cluster_data = [{
            'location': cluster.location_name,
            'count': cluster.alert_count,
            'avg_score': float(cluster.avg_score) if cluster.avg_score else 0,
            'center': {
                'lat': float(cluster.center_lat),
                'lng': float(cluster.center_lng)
            },
            'topics': str(cluster.sample_topic) if cluster.sample_topic else ''
        } for cluster in clusters]
        
        return jsonify(cluster_data)
        
    except Exception as e:
        print(f"API clusters error: {e}")
        return jsonify([])

@bp.route('/api/trends')
@login_required
def api_analytics_trends():
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Daily trends
        daily_trends = db.session.query(
            func.date(Alert.created_at).label('date'),
            func.count('*').label('alert_count'),
            func.avg(Alert.violence_score).label('avg_score')
        ).filter(
            Alert.created_at >= thirty_days_ago
        ).group_by(func.date(Alert.created_at)).order_by('date').all()
        
        # Entity distribution
        entity_distribution = db.session.query(
            AlertEntity.entity_type,
            func.count('*').label('count')
        ).join(Alert).filter(
            Alert.created_at >= thirty_days_ago
        ).group_by(AlertEntity.entity_type).order_by(func.count('*').desc()).limit(10).all()
        
        # Location trends
        location_trends = db.session.query(
            Alert.location_name,
            func.count('*').label('alert_count'),
            func.avg(Alert.violence_score).label('avg_score')
        ).filter(
            Alert.created_at >= thirty_days_ago,
            Alert.location_name.isnot(None)
        ).group_by(Alert.location_name).order_by(func.count('*').desc()).limit(10).all()
        
        # Topic trends
        topic_trends = db.session.query(
            func.case([
                (Alert.classification_details.op('::text').ilike('%bullying%'), 'Bullying'),
                (Alert.classification_details.op('::text').ilike('%discrimination%'), 'Discrimination'),
                (Alert.classification_details.op('::text').ilike('%lgbtq%'), 'LGBTQ+'),
                (Alert.classification_details.op('::text').ilike('%violence%'), 'Violence'),
                (Alert.classification_details.op('::text').ilike('%harassment%'), 'Harassment')
            ], else_='Other').label('topic'),
            func.count('*').label('alert_count'),
            func.avg(Alert.violence_score).label('avg_score')
        ).filter(
            Alert.created_at >= thirty_days_ago,
            Alert.classification_details.isnot(None)
        ).group_by('topic').order_by(func.count('*').desc()).all()
        
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
            } for location in location_trends],
            'topic_trends': [{
                'topic': topic.topic,
                'alert_count': topic.alert_count,
                'avg_score': float(topic.avg_score) if topic.avg_score else 0
            } for topic in topic_trends]
        })
        
    except Exception as e:
        print(f"API analytics trends error: {e}")
        return jsonify({
            'daily_trends': [],
            'entity_distribution': [],
            'location_trends': [],
            'topic_trends': []
        })

# -----------------------------------------
# SYSTEM STATUS AND LOGS
# -----------------------------------------

@bp.route('/api/system/status')
@login_required
def api_system_status():
    try:
        recent_logs = ProcessingLog.query.order_by(
            ProcessingLog.started_at.desc()
        ).limit(10).all()
        
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        stats = db.session.query(
            ProcessingLog.stage,
            ProcessingLog.status,
            func.count('*').label('count')
        ).filter(
            ProcessingLog.started_at >= twenty_four_hours_ago
        ).group_by(ProcessingLog.stage, ProcessingLog.status).order_by(
            ProcessingLog.stage, ProcessingLog.status
        ).all()
        
        return jsonify({
            'recent_logs': [{
                'id': log.id,
                'stage': log.stage,
                'status': log.status,
                'message': log.message,
                'processing_time': log.processing_time,
                'started_at': log.started_at.isoformat(),
                'completed_at': log.completed_at.isoformat() if log.completed_at else None
            } for log in recent_logs],
            'stats': [{
                'stage': stat.stage,
                'status': stat.status,
                'count': stat.count
            } for stat in stats]
        })
        
    except Exception as e:
        print(f"API system status error: {e}")
        return jsonify({'recent_logs': [], 'stats': []})