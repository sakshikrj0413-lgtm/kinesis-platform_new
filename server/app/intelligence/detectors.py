import random
from datetime import datetime, timedelta


def detect_sharp_money(market_id, bets=None, odds_history=None, volume_score=50):
    signals = []
    sharp_detected = False

    if bets:
        large_bets = [b for b in bets if b.get("stake", 0) > 200]
        if len(large_bets) >= 2:
            signals.append({
                "type": "large_bets",
                "count": len(large_bets),
                "total_stake": sum(b["stake"] for b in large_bets),
                "confidence": 0.7
            })
            sharp_detected = True

        recent_bets = [b for b in bets if b.get("created_at")]
        if len(recent_bets) >= 5:
            now = datetime.utcnow()
            last_10_min = [b for b in recent_bets
                          if (now - b["created_at"]).total_seconds() < 600]
            if len(last_10_min) >= 3:
                signals.append({
                    "type": "rapid_activity",
                    "count": len(last_10_min),
                    "window_seconds": 600,
                    "confidence": 0.6
                })
                sharp_detected = True

    if odds_history and len(odds_history) >= 3:
        recent = odds_history[-3:]
        movements = [abs(recent[i+1] - recent[i]) for i in range(len(recent)-1)]
        avg_movement = sum(movements) / len(movements) if movements else 0
        if avg_movement > 0.05:
            signals.append({
                "type": "rapid_odds_movement",
                "avg_movement": round(avg_movement, 4),
                "confidence": 0.65
            })
            sharp_detected = True

    if volume_score > 75:
        signals.append({
            "type": "volume_spike",
            "volume_score": volume_score,
            "confidence": 0.55
        })
        sharp_detected = True

    whale_score = 0
    for s in signals:
        whale_score += s["confidence"]
    whale_score = min(round(whale_score / max(len(signals), 1) * 100, 2), 100) if signals else 0

    return {
        "sharp_money_detected": sharp_detected,
        "signals": signals,
        "whale_score": whale_score,
        "signal_count": len(signals)
    }


def simulate_sharp_money_detection(market_id, volume_score=50):
    seed = hash(str(market_id) + str(datetime.utcnow().hour)) % 100

    sharp_detected = seed > 60

    signals = []
    if sharp_detected:
        signal_types = ["large_bets", "rapid_odds_movement", "volume_spike", "whale_activity"]
        num_signals = random.randint(1, 3)
        chosen = random.sample(signal_types, num_signals)
        for stype in chosen:
            signals.append({
                "type": stype,
                "confidence": round(random.uniform(0.55, 0.85), 2)
            })

    whale_score = round(random.uniform(60, 95), 2) if sharp_detected else round(random.uniform(10, 40), 2)

    return {
        "sharp_money_detected": sharp_detected,
        "signals": signals,
        "whale_score": whale_score,
        "signal_count": len(signals)
    }
