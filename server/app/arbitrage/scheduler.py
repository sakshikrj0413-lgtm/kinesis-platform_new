import threading
import time
from app.arbitrage.engine import engine
from app.models.market import Market
from app.models.market_outcome import MarketOutcome


class ArbScheduler:
    def __init__(self, socketio=None):
        self.socketio = socketio
        self._running = False
        self._thread = None
        self._interval = 5

    def start(self, socketio=None):
        if socketio:
            self.socketio = socketio
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    def _run_loop(self):
        while self._running:
            try:
                from app import create_app
                app = create_app()
                with app.app_context():
                    markets = Market.query.filter_by(status="OPEN").limit(10).all()
                    markets_data = []
                    for m in markets:
                        outcomes = MarketOutcome.query.filter_by(market_id=m.id).all()
                        markets_data.append({
                            "id": m.id,
                            "title": m.title,
                            "outcomes": [{"title": o.title, "odds": o.odds} for o in outcomes],
                        })

                    opportunities = engine.scan_all(markets_data)

                    if self.socketio and opportunities:
                        self.socketio.emit("arb_update", {
                            "opportunities": opportunities[:5],
                            "count": len(opportunities),
                        })

                        for opp in opportunities:
                            if opp.get("guaranteed_profit"):
                                self.socketio.emit("arb_alert", {
                                    "type": "guaranteed_profit",
                                    "market": opp["market_title"],
                                    "edge": opp["edge"],
                                    "arb_percentage": opp["arb_percentage"],
                                })

            except Exception as e:
                print(f"[ArbScheduler] Error: {e}")

            time.sleep(self._interval)


scheduler = ArbScheduler()
