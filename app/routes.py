# Add new routes (i.e., pages) to the Flask app in here. 
from flask import Blueprint, render_template

main_routes = Blueprint('main', __name__)

@main_routes.route('/home')
def home():
    return render_template('pages/index.html')  # Render the homepage
