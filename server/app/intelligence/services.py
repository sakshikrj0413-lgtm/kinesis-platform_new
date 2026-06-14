import random
from datetime import datetime, timedelta
from app.extensions import db
from app.models.market_insight import MarketInsight, MarketSentiment
from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.models.bet import Bet
from app.intelligence.calculators import (
    calculate_implied_probability,
    calculate_edge,
    estimate_true_probability,
    calculate_volume_score,
    calculate_odds_momentum,
)
from app.intelligence.detectors import detect_sharp_money, simulate_sharp_money_detection


def calculate_confidence_score(edge, volume_score, sharp_money, odds_momentum=0, liquidity=50):
    edge_factor = min(abs(edge) / 15, 1.0) * 30
    volume_factor = (volume_score / 100) * 25
    sharp_factor = 20 if sharp_money else 5
    momentum_factor = min(abs(odds_momentum) * 100, 1.0) * 10
    liquidity_factor = (liquidity / 100) * 15

    score = edge_factor + volume_factor + sharp_factor + momentum_factor + liquidity_factor
    return round(min(max(score, 0), 100), 2)


def classify_risk(confidence, edge, volatility=0.3, liquidity=50):
    risk_score = 0
    if confidence < 30:
        risk_score += 40
    elif confidence < 50:
        risk_score += 25
    elif confidence < 70:
        risk_score += 10
    else:
        risk_score += 0

    if abs(edge) > 12:
        risk_score += 30
    elif abs(edge) > 8:
        risk_score += 20
    elif abs(edge) > 4:
        risk_score += 10

    risk_score += volatility * 20

    if liquidity < 30:
        risk_score += 20
    elif liquidity < 50:
        risk_score += 10

    if risk_score < 25:
        return "safe"
    elif risk_score < 50:
        return "balanced"
    elif risk_score < 75:
        return "risky"
    else:
        return "degen"


def compute_market_intelligence(market_id):
    market = Market.query.get(market_id)
    if not market:
        return None

    outcomes = MarketOutcome.query.filter_by(market_id=market_id).all()
    bets = Bet.query.filter_by(market_id=market_id).all()

    total_volume = sum(b.stake for b in bets) if bets else 0
    total_bets = len(bets)
    volume_score = calculate_volume_score(total_bets, total_volume)

    best_outcome = None
    best_edge = -999
    best_implied = 0
    best_true = 0

    for outcome in outcomes:
        implied = calculate_implied_probability(outcome.odds)
        true = estimate_true_probability(outcome.odds, volume_score)
        edge = calculate_edge(true, implied)

        if edge > best_edge:
            best_edge = edge
            best_implied = implied
            best_true = true
            best_outcome = outcome

    if not best_outcome:
        implied = 0.5
        true = 0.55
        best_edge = calculate_edge(true, implied)
        volume_score = 50

    sharp_result = simulate_sharp_money_detection(market_id, volume_score)
    sharp_detected = sharp_result["sharp_money_detected"]

    odds_momentum = random.uniform(-0.03, 0.03)
    liquidity = min(volume_score + random.randint(-10, 10), 100)

    confidence = calculate_confidence_score(
        best_edge, volume_score, sharp_detected, odds_momentum, liquidity
    )

    risk = classify_risk(confidence, best_edge, random.uniform(0.2, 0.5), liquidity)

    insight = MarketInsight.query.filter_by(market_id=market_id).order_by(
        MarketInsight.created_at.desc()
    ).first()

    if insight:
        insight.edge_score = best_edge
        insight.confidence_score = confidence
        insight.risk_label = risk
        insight.implied_probability = best_implied
        insight.estimated_true_probability = best_true
        insight.sharp_money_detected = sharp_detected
        insight.volume_score = volume_score
        insight.created_at = datetime.utcnow()
    else:
        insight = MarketInsight(
            market_id=market_id,
            edge_score=best_edge,
            confidence_score=confidence,
            risk_label=risk,
            implied_probability=best_implied,
            estimated_true_probability=best_true,
            sharp_money_detected=sharp_detected,
            volume_score=volume_score,
        )
        db.session.add(insight)

    bullish = round(random.uniform(40, 70), 2)
    bearish = round(100 - bullish, 2)
    unusual_activity = round(random.uniform(10, 80), 2)

    sentiment = MarketSentiment.query.filter_by(market_id=market_id).order_by(
        MarketSentiment.created_at.desc()
    ).first()

    if sentiment:
        sentiment.bullish_percentage = bullish
        sentiment.bearish_percentage = bearish
        sentiment.total_volume = total_volume
        sentiment.unusual_activity_score = unusual_activity
        sentiment.created_at = datetime.utcnow()
    else:
        sentiment = MarketSentiment(
            market_id=market_id,
            bullish_percentage=bullish,
            bearish_percentage=bearish,
            total_volume=total_volume,
            unusual_activity_score=unusual_activity,
        )
        db.session.add(sentiment)

    db.session.commit()

    analysis_text = generate_analysis_text(
        market, best_edge, confidence, risk, sharp_detected, volume_score, bullish
    )

    return {
        "market_id": market_id,
        "market_title": market.title,
        "edge": best_edge,
        "market_probability": round(best_implied * 100, 2),
        "estimated_probability": round(best_true * 100, 2),
        "confidence": confidence,
        "risk": risk,
        "sharp_money": sharp_detected,
        "sharp_signals": sharp_result["signals"],
        "whale_score": sharp_result["whale_score"],
        "volume_score": volume_score,
        "market_sentiment": {
            "bullish": bullish,
            "bearish": bearish,
            "total_volume": total_volume,
            "unusual_activity": unusual_activity,
        },
        "analysis": analysis_text,
        "best_outcome": best_outcome.title if best_outcome else None,
    }


def generate_analysis_text(market, edge, confidence, risk, sharp, volume, bullish):
    parts = []

    if edge > 5:
        parts.append(f"Strong positive edge detected at +{edge:.1f}%.")
    elif edge > 0:
        parts.append(f"Moderate edge of +{edge:.1f}% identified.")
    else:
        parts.append(f"Negative edge of {edge:.1f}% — caution advised.")

    if confidence > 70:
        parts.append("High confidence in this assessment based on strong market signals.")
    elif confidence > 50:
        parts.append("Moderate confidence with mixed market indicators.")
    else:
        parts.append("Low confidence — market conditions are uncertain.")

    if sharp:
        parts.append("Sharp money activity detected — institutional interest present.")

    if bullish > 60:
        parts.append(f"Market sentiment is bullish at {bullish:.0f}%.")
    elif bullish < 40:
        parts.append(f"Market sentiment is bearish with only {bullish:.0f}% bullish.")

    risk_labels = {
        "safe": "This opportunity is classified as SAFE — low risk profile.",
        "balanced": "This opportunity is BALANCED — moderate risk-reward ratio.",
        "risky": "This opportunity is RISKY — higher volatility expected.",
        "degen": "This opportunity is DEGEN — extreme risk, proceed with caution.",
    }
    parts.append(risk_labels.get(risk, ""))

    return " ".join(parts)


def get_trending_markets(limit=10):
    markets = Market.query.filter_by(status="OPEN").all()

    trending = []
    for market in markets:
        intelligence = compute_market_intelligence(market.id)
        if intelligence:
            trending.append({
                "market_id": market.id,
                "title": market.title,
                "type": market.type,
                "edge": intelligence["edge"],
                "confidence": intelligence["confidence"],
                "risk": intelligence["risk"],
                "sharp_money": intelligence["sharp_money"],
                "volume_score": intelligence["volume_score"],
                "bullish": intelligence["market_sentiment"]["bullish"],
            })

    trending.sort(key=lambda x: (x["confidence"] + abs(x["edge"])), reverse=True)
    return trending[:limit]
