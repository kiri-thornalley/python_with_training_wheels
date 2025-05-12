# Flask app initialisation
from flask import Flask
from app.config import Config
from app.scheduler import start_scheduler
from .routes import main_routes  # Import your blueprint from the routes module

def create_app():
    """Creates Flask app, initialises APScheduler to delete uploaded files after 15 minutes."""
    app = Flask(__name__)
    app.register_blueprint(main_routes)  # Register the blueprint here

    app.config.from_object(Config)
    
    # Start background scheduler
    start_scheduler(app)

    return app
