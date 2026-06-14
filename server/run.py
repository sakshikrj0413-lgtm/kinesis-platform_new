from app import create_app
from app.extensions import socketio
from app.markets.live_odds import live_odds_engine

flask_app = create_app()

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
