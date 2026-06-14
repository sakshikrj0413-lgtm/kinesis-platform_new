from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.models.bet import Bet
from app.models.user import User
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.extensions import db, socketio
from app.socket.events import (
    emit_market_update,
    emit_market_resolved,
    emit_bet_settled,
    emit_wallet_updated_user,
    emit_transaction_added,
)
from app.middleware.auth_middleware import admin_required
from app.config import Config
from datetime import datetime


admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/markets/create", methods=["POST"])
@jwt_required()
@admin_required
def create_market():
    """Admin creates a new market"""
    user_id = get_jwt_identity()
    data = request.get_json()

    required_fields = ["title", "description", "type", "outcomes"]
    for field in required_fields:
        if field not in data:
            return {"error": f"Missing required field: {field}"}, 400

    if not data["outcomes"] or not isinstance(data["outcomes"], list):
        return {"error": "outcomes must be a non-empty list"}, 400

    market = Market(
        title=data["title"],
        description=data.get("description", ""),
        type=data["type"],
        created_by=user_id
    )

    db.session.add(market)
    db.session.flush()

    outcomes = []
    for outcome in data["outcomes"]:
        if "title" not in outcome or not outcome["title"].strip():
            return {"error": "Each outcome must have a title"}, 400

        market_outcome = MarketOutcome(
            market_id=market.id,
            title=outcome["title"].strip(),
            odds=float(outcome.get("odds", 1.5)),
            betting_price=float(outcome.get("betting_price", 0.001))
        )
        db.session.add(market_outcome)
        outcomes.append(market_outcome)

    db.session.commit()

    emit_market_update({
        "market_id": market.id,
        "type": "created",
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
        },
        "timestamp": datetime.utcnow().isoformat()
    }, socketio)

    return {
        "message": "Market created successfully",
        "market_id": market.id,
        "market": {
            "id": market.id,
            "title": market.title,
            "type": market.type,
            "status": market.status
        }
    }, 201


@admin_bp.route("/markets/<int:market_id>/resolve", methods=["POST"])
@jwt_required()
@admin_required
def resolve_market(market_id):
    """Admin resolves a market with a winning outcome"""
    data = request.get_json()
    winning_outcome_id = data.get("outcome_id")

    if not winning_outcome_id:
        return {"error": "outcome_id is required"}, 400

    market = Market.query.get(market_id)
    if not market:
        return {"error": "Market not found"}, 404

    if market.status != "OPEN":
        return {"error": f"Market is already {market.status}"}, 400

    winning_outcome = MarketOutcome.query.get(winning_outcome_id)
    if not winning_outcome or winning_outcome.market_id != market_id:
        return {"error": "Invalid outcome_id"}, 400

    market.status = "RESOLVED"
    market.resolved_at = datetime.utcnow()
    market.winning_outcome_id = winning_outcome_id

    matched_bets = Bet.query.filter(
        Bet.market_id == market_id,
        Bet.status.in_(["MATCHED", "PARTIAL"])
    ).all()

    settlement_results = []
    for bet in matched_bets:
        outcome_id = bet.outcome_id
        is_winner = (outcome_id == winning_outcome_id and bet.side == "BACK") or \
                    (outcome_id != winning_outcome_id and bet.side == "LAY")

        if is_winner:
            if bet.side == "BACK":
                payout = bet.matched_amount * bet.odds
                profit = payout - bet.matched_amount
            else:
                liability = bet.matched_amount * (bet.odds - 1)
                profit = bet.stake - liability

            wallet = Wallet.query.filter_by(user_id=bet.user_id).first()
            if wallet:
                wallet.balance += payout

                transaction = Transaction(
                    wallet_id=wallet.id,
                    type="BET_WIN",
                    amount=payout,
                    reference_id=bet.id,
                    status="completed"
                )
                db.session.add(transaction)

            bet.status = "WON"
            bet.result = "won"
            bet.payout = payout

            settlement_results.append({
                "bet_id": bet.id,
                "user_id": bet.user_id,
                "profit": profit,
                "payout": payout
            })
        else:
            bet.status = "LOST"
            bet.result = "lost"

        db.session.add(bet)

    db.session.commit()

    now = datetime.utcnow().isoformat()

    # Broadcast market resolution to all connected clients (updates Markets page)
    emit_market_resolved({
        "market_id": market_id,
        "winning_outcome_id": winning_outcome_id,
        "winning_outcome_title": winning_outcome.title,
        "timestamp": now
    }, socketio)

    # Also keep the generic market_update broadcast
    emit_market_update({
        "market_id": market_id,
        "type": "resolved",
        "winning_outcome_id": winning_outcome_id,
        "winning_outcome_title": winning_outcome.title,
        "settlement_results": settlement_results,
        "timestamp": now
    }, socketio)

    # Emit per-user events so Portfolio/Wallet update instantly without polling
    for result in settlement_results:
        uid = result["user_id"]
        bet_obj = next((b for b in matched_bets if b.id == result["bet_id"]), None)
        outcome = MarketOutcome.query.get(bet_obj.outcome_id) if bet_obj else None

        # Notify user their bet settled (WON)
        emit_bet_settled(uid, {
            "bet_id": result["bet_id"],
            "market_id": market_id,
            "market_title": market.title,
            "outcome_title": outcome.title if outcome else "",
            "side": bet_obj.side if bet_obj else "",
            "status": "WON",
            "payout": result["payout"],
            "profit": result["profit"],
            "timestamp": now
        }, socketio)

        # Emit fresh wallet balance to user
        wallet = Wallet.query.filter_by(user_id=uid).first()
        if wallet:
            emit_wallet_updated_user(uid, {
                "user_id": uid,
                "balance": wallet.balance,
                "timestamp": now
            }, socketio)

        # Emit the new BET_WIN transaction so Wallet tab appends it live
        win_tx = Transaction.query.filter_by(
            reference_id=result["bet_id"], type="BET_WIN"
        ).order_by(Transaction.created_at.desc()).first()
        if win_tx:
            emit_transaction_added(uid, {
                "id": win_tx.id,
                "type": win_tx.type,
                "amount": win_tx.amount,
                "status": win_tx.status,
                "created_at": win_tx.created_at.isoformat()
            }, socketio)

    # Emit LOST notifications for losing bettors
    for bet in matched_bets:
        if bet.status == "LOST":
            outcome = MarketOutcome.query.get(bet.outcome_id)
            emit_bet_settled(bet.user_id, {
                "bet_id": bet.id,
                "market_id": market_id,
                "market_title": market.title,
                "outcome_title": outcome.title if outcome else "",
                "side": bet.side,
                "status": "LOST",
                "payout": 0,
                "profit": -(bet.matched_amount or bet.stake),
                "timestamp": now
            }, socketio)

    return {
        "message": f"Market resolved. Winning outcome: {winning_outcome.title}",
        "market_id": market_id,
        "winning_outcome": {
            "id": winning_outcome.id,
            "title": winning_outcome.title
        },
        "settled_bets": len(settlement_results)
    }, 200


@admin_bp.route("/markets/<int:market_id>/close", methods=["POST"])
@jwt_required()
@admin_required
def close_market(market_id):
    """Admin closes a market without resolving (cancelled)"""
    market = Market.query.get(market_id)
    if not market:
        return {"error": "Market not found"}, 404

    if market.status != "OPEN":
        return {"error": f"Market is already {market.status}"}, 400

    market.status = "CLOSED"

    unmatched_bets = Bet.query.filter(
        Bet.market_id == market_id,
        Bet.status == "OPEN"
    ).all()

    for bet in unmatched_bets:
        wallet = Wallet.query.filter_by(user_id=bet.user_id).first()
        if wallet:
            wallet.balance += bet.stake
            transaction = Transaction(
                wallet_id=wallet.id,
                type="MARKET_CANCELLED",
                amount=bet.stake,
                reference_id=bet.id,
                status="completed"
            )
            db.session.add(transaction)
        bet.status = "CANCELLED"

    db.session.commit()

    emit_market_update({
        "market_id": market_id,
        "type": "closed",
        "timestamp": datetime.utcnow().isoformat()
    }, socketio)

    return {"message": "Market closed and bets refunded"}


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def get_all_users():
    """Admin views all users"""
    users = User.query.all()
    return {
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ]
    }


@admin_bp.route("/markets/all", methods=["GET"])
@jwt_required()
@admin_required
def get_all_markets():
    """Admin views all markets with full details"""
    markets = Market.query.all()
    result = []
    for market in markets:
        outcomes = MarketOutcome.query.filter_by(market_id=market.id).all()
        bet_count = Bet.query.filter_by(market_id=market.id).count()
        matched_count = Bet.query.filter(
            Bet.market_id == market.id,
            Bet.status.in_(["MATCHED", "PARTIAL", "WON", "LOST"])
        ).count()
        result.append({
            "id": market.id,
            "title": market.title,
            "description": market.description,
            "type": market.type,
            "status": market.status,
            "created_by": market.created_by,
            "created_at": market.created_at.isoformat(),
            "outcomes": [
                {"id": o.id, "title": o.title, "odds": o.odds}
                for o in outcomes
            ],
            "total_bets": bet_count,
            "matched_bets": matched_count
        })
    return {"markets": result}


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_platform_stats():
    """Admin gets platform-wide statistics"""
    total_users = User.query.filter_by(role="user").count()
    total_markets = Market.query.count()
    open_markets = Market.query.filter_by(status="OPEN").count()
    resolved_markets = Market.query.filter_by(status="RESOLVED").count()
    total_bets = Bet.query.count()
    total_volume = db.session.query(db.func.sum(Bet.stake)).scalar() or 0
    matched_volume = db.session.query(db.func.sum(Bet.matched_amount)).scalar() or 0

    return {
        "stats": {
            "total_users": total_users,
            "total_markets": total_markets,
            "open_markets": open_markets,
            "resolved_markets": resolved_markets,
            "total_bets": total_bets,
            "total_volume": round(total_volume, 2),
            "matched_volume": round(matched_volume, 2)
        }
    }


@admin_bp.route("/transactions", methods=["GET"])
@jwt_required()
@admin_required
def get_all_transactions():
    """Admin views all wallet-to-wallet transactions"""
    transactions = Transaction.query.order_by(Transaction.created_at.desc()).all()

    result = []
    for tx in transactions:
        user = None
        if tx.wallet_id:
            wallet = Wallet.query.get(tx.wallet_id)
            if wallet:
                user = User.query.get(wallet.user_id)

        market_title = None
        outcome_title = None
        if tx.bet_id:
            bet = Bet.query.get(tx.bet_id)
            if bet:
                market = Market.query.get(bet.market_id)
                outcome = MarketOutcome.query.get(bet.outcome_id)
                market_title = market.title if market else None
                outcome_title = outcome.title if outcome else None

        result.append({
            "id": tx.id,
            "type": tx.type,
            "amount": tx.amount,
            "status": tx.status,
            "from_wallet": tx.from_wallet_address,
            "to_wallet": tx.to_wallet_address,
            "tx_hash": tx.tx_hash,
            "bet_id": tx.bet_id,
            "market_title": market_title,
            "outcome_title": outcome_title,
            "created_at": tx.created_at.isoformat() if tx.created_at else None
        })

    return {"transactions": result}