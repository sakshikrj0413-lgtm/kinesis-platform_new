import random
from datetime import datetime


PLATFORMS = ["Betfair", "DraftKings", "PolyMarket", "AGON", "Pinnacle", "Bet365"]


class OddsCollector:
    def __init__(self):
        self._cache = {}

    def collect_odds(self, market_id, market_title, base_odds):
        platform_odds = []

        seed = hash(str(market_id) + str(datetime.utcnow().minute)) % 100

        for i, platform in enumerate(PLATFORMS):
            variation_seed = hash(platform + str(market_id) + str(seed)) % 100
            variation = ((variation_seed - 50) / 500)

            odds = {}
            for outcome_name, base in base_odds.items():
                o_variation = ((hash(outcome_name + platform + str(seed)) % 100 - 50) / 400)
                odds[outcome_name] = round(max(1.01, base + o_variation), 2)

            liquidity = round(random.uniform(5000, 500000), 2)

            platform_odds.append({
                "platform": platform,
                "odds": odds,
                "liquidity": liquidity,
                "fetched_at": datetime.utcnow().isoformat(),
            })

        self._cache[market_id] = platform_odds
        return platform_odds

    def get_cached(self, market_id):
        return self._cache.get(market_id, [])


collector = OddsCollector()
