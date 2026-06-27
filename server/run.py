from app import create_app
from app.extensions import socketio, db
from app.markets.live_odds import live_odds_engine

flask_app = create_app()

with flask_app.app_context():
    db.create_all()

    # ── Seed system admin user (required for FK constraints in odds seeder) ──
    from app.models.user import User
    from app.extensions import bcrypt
    system_user = User.query.filter_by(email="system@kinesis.internal").first()
    if not system_user:
        system_user = User(
            username="KINESIS System",
            email="system@kinesis.internal",
            password=bcrypt.generate_password_hash("__system__").decode("utf-8"),
            role="admin",
        )
        db.session.add(system_user)
        db.session.commit()
        print("[Seed] Created system admin user (id=%d)" % system_user.id)

# Start odds seeder AFTER system user is guaranteed in DB
from app.markets.odds_seeder import odds_seeder
odds_seeder.start()

live_odds_engine.init_app(flask_app)

@flask_app.before_request
def start_live_odds():
    if not live_odds_engine.running:
        live_odds_engine.start()

import os

if __name__ == "__main__":
    try:
        live_odds_engine.start()
        print("Live odds engine started")
    except Exception as e:
        print(f"Failed to start live odds engine: {e}")
    socketio.run(
        flask_app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=os.environ.get("FLASK_ENV") == "development",
        use_reloader=os.environ.get("FLASK_ENV") == "development",
        allow_unsafe_werkzeug=True,
    )
