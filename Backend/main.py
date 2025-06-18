import os
from flask import Flask
from flask_login import LoginManager
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv 
from models import db, User, RSSFeed, Article, Alert, AlertEntity, ProcessingLog, create_indexes
from datetime import datetime

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'faksdfaldfamrqiw21204i9fkalsamvewpoiqr')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///violence_detection.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    app.config['JSON_SORT_KEYS'] = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
    app.config['JSONIFY_MIMETYPE'] = 'application/json'
    app.config['JSON_AS_ASCII'] = False
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    
    db.init_app(app)
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'main.login'
    login_manager.login_message = 'Please log in to access this page.'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    from controllers import bp as main_bp
    app.register_blueprint(main_bp)
    
    def initialize_database():
        try:
            with app.app_context():
                db.create_all()
                create_indexes()

                if not User.query.filter_by(username='admin').first():
                    admin_user = User(
                        username='admin',
                        password=generate_password_hash('admin123')
                    )
                    db.session.add(admin_user)
                    db.session.commit()
                
                if RSSFeed.query.count() == 0:
                    sample_feeds = [
                        RSSFeed(name='BBC News', url='http://feeds.bbci.co.uk/news/rss.xml'),
                        RSSFeed(name='CNN', url='http://rss.cnn.com/rss/edition.rss'),
                        RSSFeed(name='Reuters', url='https://feeds.reuters.com/reuters/topNews'),
                        RSSFeed(name='Al Jazeera', url='https://www.aljazeera.com/xml/rss/all.xml'),
                        RSSFeed(name='Associated Press', url='https://feeds.ap.org/ap/topnews'),
                    ]
                    for feed in sample_feeds:
                        db.session.add(feed)
                    db.session.commit()
        except Exception as e:
            print(f"❌ Database initialization error: {e}")
            with app.app_context():
                db.session.rollback()
    
    initialize_database()
    
    @app.context_processor
    def inject_global_vars():
        return {
            'app_name': 'News Violence Detection System',
            'current_year': 2025
        }
    
    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(403)
    def forbidden_error(error):
        return {'error': 'Forbidden'}, 403
    
    @app.errorhandler(401)
    def unauthorized_error(error):
        return {'error': 'Unauthorized'}, 401
    
    @app.route('/health')
    def health_check():
        return {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        }
    
    return app

def setup_environment():
    required_vars = {
        'DATABASE_URL': 'Database connection string',
        'SECRET_KEY': 'Flask secret key for sessions'
    }
    
    missing_vars = []
    for var, description in required_vars.items():
        if not os.environ.get(var):
            missing_vars.append(f"  - {var}: {description}")
    
    if missing_vars:
        print("⚠️  Missing environment variables:")
        for var in missing_vars:
            print(var)
        print("Example .env file:")
        print("DATABASE_URL=postgresql://user:password@localhost:5432/violence_db")
        print("SECRET_KEY=your-very-secret-random-key-here")
        print("FLASK_ENV=development")
        print("=" * 60)

def main():
    print("🚀 Starting News Violence Detection System...")
    print("=" * 60)
    
    setup_environment()
    
    app = create_app()
    
    db_url = app.config['SQLALCHEMY_DATABASE_URI']
    if 'sqlite' in db_url:
        db_info = "SQLite (Local file database)"
    elif 'postgresql' in db_url:
        db_info = db_url.split('@')[-1] if '@' in db_url else 'PostgreSQL'
    else:
        db_info = "Unknown database type"
    
    print(f"📊 Database: {db_info}")
    print("🔗 Available endpoints:")
    print("   - Dashboard: http://localhost:5000/")
    print("   - Login: http://localhost:5000/login")
    print("   - Register: http://localhost:5000/register")
    print("   - Health Check: http://localhost:5000/health")
    print("   - API Alerts: http://localhost:5000/api/alerts")
    print("   - RSS Feeds: http://localhost:5000/api/rss-feeds")
    print("   - Map Data: http://localhost:5000/api/map/heatmap")
    print("   - Analytics: http://localhost:5000/api/analytics/trends")
    print("=" * 60)
    
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    
    print(f"🌐 Server starting on {host}:{port}")
    print(f"🔧 Debug mode: {'ON' if debug_mode else 'OFF'}")
    print("=" * 60)
    
    try:
        app.run(
            host=host,
            port=port,
            debug=debug_mode,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == '__main__':
    main()
