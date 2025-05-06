## This file will run the app in flask when called with python3 run.py

from app import create_app

app = create_app()  # Initialise the app

if __name__ == "__main__":
    app.run(debug=True)  # Run the app in debug mode for development