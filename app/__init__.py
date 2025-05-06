# Flask app initialisation

from flask import Flask
from .routes import main_routes  # Import your blueprint from the routes module

def create_app():
    app = Flask(__name__)
    app.register_blueprint(main_routes)  # Register the blueprint here
    return app
