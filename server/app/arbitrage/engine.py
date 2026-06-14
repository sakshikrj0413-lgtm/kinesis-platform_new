import random
from datetime import datetime
from app.arbitrage.collectors import collector
from app.arbitrage.normalizers import normalize_odds, find_best_odds, calculate_arb_percentage, decimal_to_implied_probability


class ArbEngine:
    def scan_market(self, market_id, market_title, outcomes):
        base_odds = {}
        for o in outcomes:
            base_odds[o["title"]] = o["odds"]

        platform_odds = collector.collect_odds(market_id, market_title, base_odds)
        normalized = normalize_odds(platform_odds)
        best = find_best_odds(normalized)

        arb_pct, is_guaranteed = calculate_arb_percentage(best)

        agon_odds = base_odds
        opportunities = []

        for outcome_name, best_data in best.items():
            agn_odd = agon_odds.get(outcome_name, 0)
            if agn_odd > 0 and best_data["decimal"] > agn_odd:
                edge = round(((best_data["decimal"] - agn_odd) / agn_odd) * 100, 2)
            elif agn_odd > 0:
                edge = round(((agn_odd - best_data["decimal"]) / best_data["decimal"]) * 100, 2)
            else:
                edge = 0

            confidence = round(random.uniform(55, 95), 2)

            opportunities.append({
                "market_id": market_id,
                "market_title": market_title,
                "outcome": outcome_name,
                "best_platform": best_data["platform"],
                "best_odds": best_data["decimal"],
                "agon_odds": agn_odd,
                "edge": abs(edge),
                "confidence": confidence,
                "guaranteed_profit": is_guaranteed and arb_pct > 1,
                "arb_percentage": arb_pct if is_guaranteed else 0,
                "implied_probability": best_data["implied_probability"],
            })

        platform_comparison = {}
        for po in platform_odds:
            platform_comparison[po["platform"]] = po["odds"]

        return {
            "market_id": market_id,
            "market_title": market_title,
            "opportunities": sorted(opportunities, key=lambda x: x["edge"], reverse=True),
            "platform_comparison": platform_comparison,
            "guaranteed_profit": is_guaranteed and arb_pct > 1,
            "arb_percentage": arb_pct if is_guaranteed else 0,
            "scan_time": datetime.utcnow().isoformat(),
        }

    def scan_all(self, markets_data):
        all_opportunities = []
        for m in markets_data:
            result = self.scan_market(m["id"], m["title"], m["outcomes"])
            if result["opportunities"]:
                best_opp = result["opportunities"][0]
                all_opportunities.append({
                    "market_id": result["market_id"],
                    "market_title": result["market_title"],
                    "best_platform": best_opp["best_platform"],
                    "best_odds": best_opp["best_odds"],
                    "agon_odds": best_opp["agon_odds"],
                    "edge": best_opp["edge"],
                    "confidence": best_opp["confidence"],
                    "guaranteed_profit": result["guaranteed_profit"],
                    "arb_percentage": result["arb_percentage"],
                    "platform_comparison": result["platform_comparison"],
                    "scan_time": result["scan_time"],
                })

        all_opportunities.sort(key=lambda x: x["edge"], reverse=True)
        return all_opportunities


engine = ArbEngine()
