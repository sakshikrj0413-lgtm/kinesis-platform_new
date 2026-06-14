def decimal_to_implied_probability(decimal_odds):
    if decimal_odds <= 1:
        return 1.0
    return round(1.0 / decimal_odds, 4)


def implied_probability_to_decimal(probability):
    if probability <= 0:
        return 999.0
    return round(1.0 / probability, 2)


def normalize_odds(platform_odds_list):
    normalized = []
    for po in platform_odds_list:
        entry = {
            "platform": po["platform"],
            "liquidity": po["liquidity"],
            "fetched_at": po["fetched_at"],
            "outcomes": {},
        }
        for outcome_name, odds in po["odds"].items():
            entry["outcomes"][outcome_name] = {
                "decimal": odds,
                "implied_probability": decimal_to_implied_probability(odds),
            }
        normalized.append(entry)
    return normalized


def find_best_odds(normalized_odds):
    best = {}
    for po in normalized_odds:
        for outcome_name, data in po["outcomes"].items():
            if outcome_name not in best or data["decimal"] > best[outcome_name]["decimal"]:
                best[outcome_name] = {
                    "decimal": data["decimal"],
                    "platform": po["platform"],
                    "implied_probability": data["implied_probability"],
                }
    return best


def calculate_arb_percentage(best_odds):
    total_implied = sum(v["implied_probability"] for v in best_odds.values())
    if total_implied >= 1:
        return 0, False
    arb_pct = round((1 - total_implied) * 100, 2)
    return arb_pct, True
