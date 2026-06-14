from flask import Blueprint, request
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)
from datetime import datetime

from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.models.bet import Bet

from app.bets.services import get_orderbook
from app.markets.live_odds import live_odds_engine
from app.middleware.auth_middleware import admin_required
from app.extensions import db

market_bp = Blueprint("markets", __name__)


# GET ALL MARKETS (Public)
@market_bp.route("/", methods=["GET"])
def get_markets():

    markets = Market.query.filter(Market.status != "CLOSED").all()

    result = []

    for market in markets:

        outcomes = MarketOutcome.query.filter_by(
            market_id=market.id
        ).all()

        total_volume = db.session.query(db.func.sum(Bet.stake)).filter(
            Bet.market_id == market.id
        ).scalar() or 0

        matched_volume = db.session.query(db.func.sum(Bet.matched_amount)).filter(
            Bet.market_id == market.id
        ).scalar() or 0

        # Calculate total bets for each outcome to get vote percentage
        outcome_bets = {}
        total_bets = 0
        for outcome in outcomes:
            outcome_stake = db.session.query(db.func.sum(Bet.stake)).filter(
                Bet.market_id == market.id,
                Bet.outcome_id == outcome.id
            ).scalar() or 0
            outcome_bets[outcome.id] = outcome_stake
            total_bets += outcome_stake

        result.append({
            "id": market.id,
            "title": market.title,
            "description": market.description,
            "type": market.type,
            "status": market.status,
            "volume_24h": round(total_volume, 2),
            "liquidity": round(matched_volume * 2, 2),
            "outcomes": [
                {
                    "id": outcome.id,
                    "title": outcome.title,
                    "odds": outcome.odds,
                    "betting_price": outcome.betting_price,
                    "vote_percentage": round((outcome_bets[outcome.id] / total_bets * 100), 2) if total_bets > 0 else 0
                }
                for outcome in outcomes
            ]
        })

    return result


# GET SINGLE MARKET (Public)
@market_bp.route("/<int:market_id>", methods=["GET"])
def get_market(market_id):

    market = Market.query.get_or_404(market_id)

    outcomes = MarketOutcome.query.filter_by(
        market_id=market.id
    ).all()

    total_volume = db.session.query(db.func.sum(Bet.stake)).filter(
        Bet.market_id == market_id
    ).scalar() or 0

    matched_volume = db.session.query(db.func.sum(Bet.matched_amount)).filter(
        Bet.market_id == market_id
    ).scalar() or 0

    winning_outcome = None
    if market.status == "RESOLVED" and market.winning_outcome_id:
        winning_outcome = MarketOutcome.query.get(market.winning_outcome_id)

    # Calculate total bets for each outcome to get vote percentage
    outcome_bets = {}
    total_bets = 0
    for outcome in outcomes:
        outcome_stake = db.session.query(db.func.sum(Bet.stake)).filter(
            Bet.market_id == market_id,
            Bet.outcome_id == outcome.id
        ).scalar() or 0
        outcome_bets[outcome.id] = outcome_stake
        total_bets += outcome_stake

    return {
        "id": market.id,
        "title": market.title,
        "description": market.description,
        "type": market.type,
        "status": market.status,
        "created_by": market.created_by,
        "volume_24h": round(total_volume, 2),
        "liquidity": round(matched_volume * 2, 2),
        "winning_outcome": {
            "id": winning_outcome.id,
            "title": winning_outcome.title
        } if winning_outcome else None,
        "outcomes": [
            {
                "id": outcome.id,
                "title": outcome.title,
                "odds": outcome.odds,
                "betting_price": outcome.betting_price,
                "vote_percentage": round((outcome_bets[outcome.id] / total_bets * 100), 2) if total_bets > 0 else 0
            }
            for outcome in outcomes
        ]
    }


# UPDATE ODDS (Admin only)
@market_bp.route("/outcome/<int:outcome_id>/odds", methods=["PATCH"])
@jwt_required()
@admin_required
def update_odds(outcome_id):

    data = request.get_json()

    outcome = MarketOutcome.query.get_or_404(outcome_id)

    if "odds" not in data:
        return {"error": "odds field is required"}, 400

    outcome.odds = data["odds"]

    db.session.commit()

    return {
        "message": "Odds updated",
        "odds": outcome.odds
    }


# UPDATE BETTING PRICE (Admin only)
@market_bp.route("/outcome/<int:outcome_id>/betting-price", methods=["PATCH"])
@jwt_required()
@admin_required
def update_betting_price(outcome_id):

    data = request.get_json()

    outcome = MarketOutcome.query.get_or_404(outcome_id)

    if "betting_price" not in data:
        return {"error": "betting_price field is required"}, 400

    betting_price = float(data["betting_price"])
    if betting_price <= 0:
        return {"error": "betting_price must be greater than 0"}, 400

    outcome.betting_price = betting_price

    db.session.commit()

    return {
        "message": "Betting price updated",
        "betting_price": outcome.betting_price
    }


# GET ORDERBOOK (Public)
@market_bp.route("/<int:market_id>/orderbook", methods=["GET"])
def orderbook(market_id):

    orderbook = get_orderbook(market_id)

    if not orderbook:
        return {"error": "Market not found"}, 404

    return orderbook, 200


# GET LIVE ODDS (Public)
@market_bp.route("/live-odds/<int:market_id>", methods=["GET"])
def get_live_odds(market_id):

    market = Market.query.get_or_404(market_id)
    outcomes = MarketOutcome.query.filter_by(market_id=market.id).all()

    total_volume = db.session.query(db.func.sum(Bet.stake)).filter(
        Bet.market_id == market_id
    ).scalar() or 0

    matched_volume = db.session.query(db.func.sum(Bet.matched_amount)).filter(
        Bet.market_id == market_id
    ).scalar() or 0

    open_bets = Bet.query.filter(
        Bet.market_id == market_id,
        Bet.status.in_(["OPEN", "PARTIAL"])
    ).count()

    live_data = {
        "market_id": market_id,
        "traders_online": open_bets,
        "total_liquidity": round(matched_volume * 2, 2),
        "volume_24h": round(total_volume, 2),
        "outcomes": []
    }

    for outcome in outcomes:
        cached = live_odds_engine.get_cached_odds(market_id, outcome.id)
        live_data["outcomes"].append({
            "id": outcome.id,
            "title": outcome.title,
            "odds": cached["odds"] if cached else outcome.odds,
            "change": cached["change"] if cached else "stable",
            "last_update": cached["timestamp"] if cached else datetime.utcnow().isoformat()
        })

    return live_data


# GET MARKET ACTIVITY (Public)
@market_bp.route("/<int:market_id>/activity", methods=["GET"])
def get_market_activity(market_id):

    market = Market.query.get_or_404(market_id)
    bets = Bet.query.filter(
        Bet.market_id == market_id
    ).order_by(Bet.created_at.desc()).limit(20).all()

    return {
        "market_id": market_id,
        "recent_bets": [
            {
                "id": bet.id,
                "side": bet.side,
                "outcome_id": bet.outcome_id,
                "stake": bet.stake,
                "odds": bet.odds,
                "status": bet.status,
                "created_at": bet.created_at.isoformat()
            }
            for bet in bets
        ]
    }

# CREATE MARKET (Authenticated users)
@market_bp.route("/create", methods=["POST"])
@jwt_required()
def create_market():
    from app.markets.services import create_market as svc_create_market
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        market, outcomes = svc_create_market(data, user_id)
        return {
            "message": "Market created",
            "market": {
                "id": market.id,
                "title": market.title,
                "description": market.description,
                "type": market.type,
                "status": market.status,
                "outcomes": [
                    {"id": o.id, "title": o.title, "odds": o.odds}
                    for o in outcomes
                ]
            }
        }, 201
    except ValueError as e:
        return {"error": str(e)}, 400
