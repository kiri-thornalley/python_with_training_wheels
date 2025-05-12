from flask_apscheduler import APScheduler
from datetime import datetime, timedelta
import os

scheduler = APScheduler()

def delete_old_uploads():
    upload_dir = os.path.join('static', 'uploads')
    if not os.path.exists(upload_dir):
        return
    now = datetime.now()
    for filename in os.listdir(upload_dir):
        filepath = os.path.join(upload_dir, filename)
        if os.path.isfile(filepath):
            file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
            if now - file_time > timedelta(minutes=15):
                try:
                    os.remove(filepath)
                except Exception as e:
                    print(f"Error deleting {filepath}: {e}")

def start_scheduler(app):
    scheduler.init_app(app)
    scheduler.start()

    scheduler.add_job(
        id='delete_old_uploads',
        func=delete_old_uploads,
        trigger='interval',
        minutes=5
    )