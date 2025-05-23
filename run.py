## This file will run the app in flask when called with python3 run.py
from app import create_app

app = create_app()  # Initialise the app
app.secret_key = 'BumBlEBee'

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False) 
    #app.run(debug=True) # Run the app in debug mode for development