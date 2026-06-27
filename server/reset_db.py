from app import create_app
from app.extensions import db

app = create_app()
with app.app_context():
    print("Dropping all existing database tables...")
    db.drop_all()
    print("Recreating database tables with the latest schema...")
    db.create_all()
    print("Database tables successfully reset!")
