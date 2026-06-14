import threading
import random
import json
from datetime import datetime

from app.models.market_outcome import MarketOutcome
from app.redis_client import redis_client


class LiveOddsEngine:
    def __init__(self, app=None, interval=5):
        self.app = app
        self.interval = interval
        self.running = False
        self.thread = None

    def init_app(self, app):
        self.app = app

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)

    def _run_loop(self):
        while self.running:
            self._update_odds()
            threading.Event().wait(self.interval)

    def _update_odds(self):
        if not self.app:
            print("Live odds engine not initialized with app")
            return

        with self.app.app_context():
            try:
                from app.extensions import db, socketio
                from app.socket.events import emit_odds_update, emit_live_activity
                outcomes = MarketOutcome.query.all()

                for outcome in outcomes:
                    prev_odds = outcome.odds
                    change = (random.random() - 0.5) * 0.08
                    new_odds = max(0.01, min(0.99, outcome.odds + change))
                    # new_odds = max(0.001, min(0.03, outcome.odds + change))
                    outcome.odds = round(new_odds, 4)

                    change_direction = "up" if change > 0.01 else "down" if change < -0.01 else "stable"

                    cache_key = f"live_odds:{outcome.market_id}:{outcome.id}"
                    cache_data = {
                        "odds": outcome.odds,
                        "change": change_direction,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    redis_client.setex(cache_key, 10, json.dumps(cache_data))

                    emit_odds_update({
                        "market_id": outcome.market_id,
                        "outcome_id": outcome.id,
                        "odds": outcome.odds,
                        "change": change_direction
                    }, socketio)

                    if change_direction != "stable":
                        traders = ["Alex", "Maria", "James", "Emma", "Ryan", "Sofia", "Chen", "Yuki", "Omar", "Lisa"]
                        trader = random.choice(traders)
                        action = random.choice(["backed", "laid"])
                        emit_live_activity({
                            "type": "odds_change",
                            "trader": trader,
                            "action": action,
                            "outcome": outcome.title,
                            "odds": outcome.odds,
                            "direction": change_direction,
                            "timestamp": datetime.utcnow().isoformat()
                        }, socketio)

                db.session.commit()
            except Exception as e:
                print(f"Live odds update error: {e}")
                from app.extensions import db
                try:
                    db.session.rollback()
                except:
                    pass

    def get_cached_odds(self, market_id, outcome_id):
        if not self.app:
            return None

        with self.app.app_context():
            cache_key = f"live_odds:{market_id}:{outcome_id}"
            data = redis_client.get(cache_key)
            if data:
                return json.loads(data)
            outcome = MarketOutcome.query.get(outcome_id)
            if outcome:
                return {
                    "odds": outcome.odds,
                    "change": "stable",
                    "timestamp": datetime.utcnow().isoformat()
                }
            return None


live_odds_engine = LiveOddsEngine()