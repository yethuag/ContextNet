import os
from flask import Flask
from flask_login import LoginManager
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv 
from models import db, User, RSSFeed, Article, Alert, AlertEntity, ProcessingLog, create_indexes
from controllers import * 

# Load environment variables from .env file automatically
load_dotenv()

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # ==========================================
    # CONFIGURATION
    # ==========================================
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'faksdfaldfamrqiw21204i9fkalsamvewpoiqr')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    app.config['JSON_SORT_KEYS'] = False  # Prevent sorting of JSON keys
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True  # Pretty print JSON responses
    app.config['JSONIFY_MIMETYPE'] = 'application/json'
    app.config['JSON_AS_ASCII'] = False  # Allow non-ASCII characters in JSON responses
    app.config['TEMPLATES_AUTO_RELOAD'] = True  # Auto-reload templates in development
    
    db.init_app(app)
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    
    # ==========================================
    # DATABASE INITIALIZATION
    # ==========================================
    
    def initialize_database():
        """Initialize database tables and default data"""
        try:
            with app.app_context():
                db.create_all()
                print("✅ Database tables created successfully!")
                
                create_indexes()
                print("✅ Database indexes created successfully!")

                if not User.query.filter_by(username='admin').first():
                    admin_user = User(
                        username='admin',
                        password=generate_password_hash('admin123')  # Change in production!
                    )
                    db.session.add(admin_user)
                    db.session.commit()
                    print("✅ Default admin user created (username: admin, password: admin123)")
                    print("⚠️  IMPORTANT: Change the admin password in production!")
                
                if RSSFeed.query.count() == 0:
                    sample_feeds = [
                        RSSFeed(name='BBC News', url='http://feeds.bbci.co.uk/news/rss.xml'),
                        RSSFeed(name='CNN', url='http://rss.cnn.com/rss/edition.rss'),
                        RSSFeed(name='Reuters', url='https://feeds.reuters.com/reuters/topNews'),
                        RSSFeed(name='Al Jazeera', url='https://www.aljazeera.com/xml/rss/all.xml'),
                    ]
                    db.session.bulk_save_objects(sample_feeds)
                    db.session.commit()
                    print("✅ Sample RSS feeds added successfully!")
                
        except Exception as e:
            print(f"❌ Database initialization error: {e}")
            with app.app_context():
                db.session.rollback()
    
    # Call initialization immediately when app is created
    initialize_database()
    
    # ==========================================
    # APPLICATION CONTEXT PROCESSORS
    # ==========================================
    
    @app.context_processor
    def inject_global_vars():
        return {
            'app_name': 'News Violence Detection System',
            'current_year': 2025
        }
    
    # ==========================================
    # ERROR HANDLERS
    # ==========================================
    
    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    return app

def setup_environment():
    """Warn if environment variables are missing"""
    if not os.environ.get('DATABASE_URL'):
        print("⚠️  DATABASE_URL not set in environment variables")
        print("Using default PostgreSQL connection string")
        print("For production, set: export DATABASE_URL='postgresql://user:pass@host:port/dbname'")
    
    if not os.environ.get('SECRET_KEY'):
        print("⚠️  SECRET_KEY not set in environment variables")
        print("Using default key - CHANGE THIS IN PRODUCTION!")
        print("Set: export SECRET_KEY='your-very-secret-key-here'")

def main():
    print("🚀 Starting News Violence Detection System...")
    print("=" * 60)
    
    setup_environment()
    
    app = create_app()
    
    db_url = app.config['SQLALCHEMY_DATABASE_URI']
    db_info = db_url.split('@')[-1] if '@' in db_url else 'Local PostgreSQL'
    print(f"📊 Database: {db_info}")
    print("🔗 Available endpoints:")
    print("   - Dashboard: http://localhost:5000/")
    print("   - Login: http://localhost:5000/login")
    print("   - API Alerts: http://localhost:5000/api/alerts")
    print("   - RSS Feeds: http://localhost:5000/api/rss-feeds")
    print("=" * 60)
    
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    
    app.run(
        host=host,
        port=port,
        debug=debug_mode,
        threaded=True
    )

if __name__ == '__main__':
    main()