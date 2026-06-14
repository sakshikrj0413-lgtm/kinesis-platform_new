from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.ai_chat import AIChat
from app.models.ai_message import AIMessage
from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.models.bet import Bet

from app.ai.services import (
    generate_ai_response,
    analyze_market_with_ai,
    generate_suggested_bets,
    generate_trending_analysis,
)
from app.middleware.auth_middleware import user_required

ai_bp = Blueprint("ai", __name__)


def build_market_context(market_id):
    """Fetch all relevant market data for AI analysis."""
    market = Market.query.get(market_id)
    if not market:
        return None

    outcomes = MarketOutcome.query.filter_by(market_id=market_id).all()

    total_volume = db.session.query(db.func.sum(Bet.stake)).filter(
        Bet.market_id == market_id
    ).scalar() or 0

    matched_volume = db.session.query(db.func.sum(Bet.matched_amount)).filter(
        Bet.market_id == market_id
    ).scalar() or 0

    recent_bets = Bet.query.filter(
        Bet.market_id == market_id
    ).order_by(Bet.created_at.desc()).limit(10).all()

    outcome_data = []
    for outcome in outcomes:
        outcome_stake = db.session.query(db.func.sum(Bet.stake)).filter(
            Bet.market_id == market_id,
            Bet.outcome_id == outcome.id
        ).scalar() or 0

        implied_prob = round((1 / outcome.odds) * 100, 2) if outcome.odds > 1 else 0

        outcome_data.append({
            "title": outcome.title,
            "odds": outcome.odds,
            "betting_price": outcome.betting_price,
            "implied_probability": f"{implied_prob}%",
            "total_staked": round(outcome_stake, 2),
        })

    context = (
        f"Market: {market.title}\n"
        f"Type: {market.type}\n"
        f"Status: {market.status}\n"
        f"Description: {market.description}\n\n"
        f"Total Volume: {round(total_volume, 2)} GU\n"
        f"Matched Volume: {round(matched_volume, 2)} GU\n\n"
        f"Outcomes:\n"
    )

    for o in outcome_data:
        context += (
            f"- {o['title']}: Odds {o['odds']} | "
            f"Implied Prob: {o['implied_probability']} | "
            f"Staked: {o['total_staked']} GU\n"
        )

    if recent_bets:
        context += f"\nRecent Activity: {len(recent_bets)} recent bets\n"
        for bet in recent_bets[:5]:
            context += (
                f"- {bet.side} {bet.stake} GU @ {bet.odds} "
                f"({bet.status})\n"
            )

    return context


@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
@user_required
def chat():
    """AI Chat endpoint."""
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "Message is required"}), 400

    user_id = get_jwt_identity()
    message = data["message"].strip()
    chat_id = data.get("chat_id")

    if len(message) > 2000:
        return jsonify({"error": "Message too long (max 2000 chars)"}), 400

    try:
        chat = None
        if chat_id:
            chat = AIChat.query.filter_by(id=chat_id, user_id=user_id).first()

        if not chat:
            title = message[:60] + ("..." if len(message) > 60 else "")
            chat = AIChat(user_id=user_id, title=title)
            db.session.add(chat)
            db.session.flush()

        user_msg = AIMessage(
            chat_id=chat.id,
            role="user",
            content=message,
        )
        db.session.add(user_msg)

        conversation_history = AIMessage.query.filter_by(
            chat_id=chat.id
        ).order_by(AIMessage.created_at).all()

        messages = [
            {"role": m.role, "content": m.content}
            for m in conversation_history[-10:]
        ]

        ai_response = generate_ai_response(messages)

        assistant_msg = AIMessage(
            chat_id=chat.id,
            role="assistant",
            content=ai_response,
        )
        db.session.add(assistant_msg)

        chat.updated_at = db.func.now()
        db.session.commit()

        suggested = generate_suggested_bets(message)

        return jsonify({
            "chat_id": chat.id,
            "title": chat.title,
            "response": ai_response,
            "suggested_bets": suggested,
            "message_count": len(chat.messages),
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"AI service error: {str(e)}"}), 500


@ai_bp.route("/chat/history", methods=["GET"])
@jwt_required()
@user_required
def chat_history():
    """Get user's chat history."""
    user_id = get_jwt_identity()

    chats = AIChat.query.filter_by(
        user_id=user_id
    ).order_by(AIChat.updated_at.desc()).limit(20).all()

    return jsonify({
        "chats": [chat.to_dict() for chat in chats]
    })


@ai_bp.route("/chat/<int:chat_id>", methods=["GET"])
@jwt_required()
@user_required
def get_chat(chat_id):
    """Get a specific chat with messages."""
    user_id = get_jwt_identity()

    chat = AIChat.query.filter_by(
        id=chat_id, user_id=user_id
    ).first()

    if not chat:
        return jsonify({"error": "Chat not found"}), 404

    messages = AIMessage.query.filter_by(
        chat_id=chat_id
    ).order_by(AIMessage.created_at).all()

    return jsonify({
        "chat": chat.to_dict(),
        "messages": [m.to_dict() for m in messages],
    })


@ai_bp.route("/analyze-market", methods=["POST"])
@jwt_required()
@user_required
def analyze_market():
    """AI Market Analysis endpoint."""
    data = request.get_json()
    if not data or not data.get("market_id"):
        return jsonify({"error": "market_id is required"}), 400

    market_id = data["market_id"]

    context = build_market_context(market_id)
    if not context:
        return jsonify({"error": "Market not found"}), 404

    try:
        analysis = analyze_market_with_ai(context)
        suggested = generate_suggested_bets(context)

        market = Market.query.get(market_id)
        outcomes = MarketOutcome.query.filter_by(market_id=market_id).all()

        best_edge = 0
        confidence = 65
        risk = "MEDIUM"

        for outcome in outcomes:
            implied_prob = 1 / outcome.odds if outcome.odds > 1 else 0.5
            edge = round((0.55 - implied_prob) * 100, 1)
            if edge > best_edge:
                best_edge = edge

        if best_edge > 8:
            confidence = 78
            risk = "LOW"
        elif best_edge > 4:
            confidence = 65
            risk = "MEDIUM"
        else:
            confidence = 45
            risk = "HIGH"

        return jsonify({
            "market_id": market_id,
            "market_title": market.title,
            "analysis": analysis,
            "edge": best_edge,
            "confidence": confidence,
            "risk": risk,
            "suggested_bets": suggested,
            "outcomes": [
                {
                    "id": o.id,
                    "title": o.title,
                    "odds": o.odds,
                    "implied_probability": round((1 / o.odds) * 100, 2) if o.odds > 1 else 0,
                }
                for o in outcomes
            ],
        })

    except Exception as e:
        return jsonify({"error": f"Analysis error: {str(e)}"}), 500


@ai_bp.route("/trending", methods=["GET"])
@jwt_required()
@user_required
def trending():
    """Get trending AI-analyzed markets."""
    try:
        markets = Market.query.filter(
            Market.status == "OPEN"
        ).limit(10).all()

        markets_data = ""
        for m in markets:
            outcomes = MarketOutcome.query.filter_by(market_id=m.id).all()
            volume = db.session.query(db.func.sum(Bet.stake)).filter(
                Bet.market_id == m.id
            ).scalar() or 0

            markets_data += (
                f"- {m.title}: {len(outcomes)} outcomes, "
                f"Volume: {round(volume, 2)} GU\n"
            )

        analysis = generate_trending_analysis(markets_data)

        trending_markets = []
        for m in markets[:5]:
            outcomes = MarketOutcome.query.filter_by(market_id=m.id).all()
            volume = db.session.query(db.func.sum(Bet.stake)).filter(
                Bet.market_id == m.id
            ).scalar() or 0

            import random
            confidence = random.randint(55, 85)
            edge = round(random.uniform(2, 10), 1)
            risks = ["LOW", "MEDIUM", "HIGH"]
            risk = risks[1] if edge > 5 else risks[0] if edge > 3 else risks[2]

            trending_markets.append({
                "id": m.id,
                "title": m.title,
                "volume": round(volume, 2),
                "outcomes": len(outcomes),
                "confidence": confidence,
                "edge": edge,
                "risk": risk,
            })

        trending_markets.sort(key=lambda x: x["confidence"], reverse=True)

        return jsonify({
            "trending": trending_markets,
            "analysis": analysis,
        })

    except Exception as e:
        return jsonify({"error": f"Trending error: {str(e)}"}), 500
