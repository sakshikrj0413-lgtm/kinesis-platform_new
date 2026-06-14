"""
Odds API seeder — pulls real sports events from The Odds API
and auto-creates markets in the DB on server startup + every hour.
API docs: https://the-odds-api.com/liveapi/guides/v4/
"""
import threading
import requests
import os
from datetime import datetime

THE_ODDS_API_KEY = os.getenv("ODDS_API_KEY", "f96cc822b1b14bd0890d76da01f3c9bb")

# Sports to seed — free tier supports these
SPORTS = [
    "cricket_ipl",
    "soccer_epl",
    "soccer_uefa_champs_league",
    "basketball_nba",
    "americanfootball_nfl",
]

REGIONS = "us,uk,eu,au"
MARKETS = "h2h"  # head-to-head (win/draw/win)
ODDS_FORMAT = "decimal"


def fetch_events(sport):
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds/"
    params = {
        "apiKey": THE_ODDS_API_KEY,
        "regions": REGIONS,
        "markets": MARKETS,
        "oddsFormat": ODDS_FORMAT,
        "dateFormat": "iso",
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"[OddsSeeder] {sport} → HTTP {resp.status_code}: {resp.text[:200]}")
            return []
    except Exception as e:
        print(f"[OddsSeeder] {sport} fetch error: {e}")
        return []


def seed_markets(app):
    with app.app_context():
        from app.extensions import db
        from app.models.market import Market
        from app.models.market_outcome import MarketOutcome

        seeded = 0
        for sport in SPORTS:
            events = fetch_events(sport)
            for event in events[:5]:  # max 5 per sport to stay within free tier
                title = f"{event.get('home_team')} vs {event.get('away_team')}"

                # Skip if already exists
                existing = Market.query.filter_by(title=title).first()
                if existing:
                    continue

                sport_label = sport.replace("_", " ").title()
                market = Market(
                    title=title,
                    description=f"{sport_label} — {event.get('commence_time', '')[:10]}",
                    type="BINARY",
                    status="OPEN",
                    created_by=1  # system user
                )
                db.session.add(market)
                db.session.flush()

                # Get best bookmaker odds
                bookmakers = event.get("bookmakers", [])
                outcomes_data = []
                if bookmakers:
                    bk = bookmakers[0]
                    for mkt in bk.get("markets", []):
                        if mkt["key"] == "h2h":
                            for o in mkt["outcomes"]:
                                outcomes_data.append({
                                    "title": o["name"],
                                    "odds": round(1 / o["price"], 4) if o["price"] > 0 else 0.5
                                })

                # Fallback outcomes if no bookmaker data
                if not outcomes_data:
                    outcomes_data = [
                        {"title": event.get("home_team", "Home"), "odds": 0.5},
                        {"title": event.get("away_team", "Away"), "odds": 0.5},
                    ]

                for o in outcomes_data:
                    outcome = MarketOutcome(
                        market_id=market.id,
                        title=o["title"],
                        odds=o["odds"],
                    )
                    db.session.add(outcome)

                seeded += 1

        db.session.commit()
        print(f"[OddsSeeder] Seeded {seeded} new markets")


class OddsSeederScheduler:
    def __init__(self):
        self.app = None
        self.running = False
        self.thread = None
        self.interval = 3600  # re-seed every hour

    def init_app(self, app):
        self.app = app

    def start(self):
        if self.running:
            return
        self.running = True
        # Seed immediately on startup
        threading.Thread(target=self._seed_now, daemon=True).start()
        # Then schedule hourly
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def _seed_now(self):
        print("[OddsSeeder] Seeding markets from The Odds API...")
        try:
            seed_markets(self.app)
        except Exception as e:
            print(f"[OddsSeeder] Seed error: {e}")

    def _loop(self):
        import time
        time.sleep(self.interval)
        while self.running:
            try:
                seed_markets(self.app)
            except Exception as e:
                print(f"[OddsSeeder] Loop error: {e}")
            time.sleep(self.interval)


odds_seeder = OddsSeederScheduler()
