from app.extensions import db, socketio
from app.socket.events import emit_bet_matched, emit_market_update, emit_live_activity, emit_orderbook_update
from app.models.bet import Bet
from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.user import User
from app.config import Config
from datetime import datetime
import random


def validate_bet_request(data):
    required_fields = ["market_id", "outcome_id", "side", "stake", "odds"]
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"

    if data["side"] not in ["BACK", "LAY"]:
        return False, "Side must be BACK or LAY"

    if data["stake"] <= 0:
        return False, "Stake must be positive"

    if data["odds"] <= 0:
        return False, "Odds must be positive"

    return True, None


def get_market_and_outcome(market_id, outcome_id):
    market = Market.query.get(market_id)
    if not market:
        return None, None, "Market not found"

    if market.status != "OPEN":
        return None, None, "Market is not open for betting"

    outcome = MarketOutcome.query.get(outcome_id)
    if not outcome:
        return None, None, "Outcome not found"

    if outcome.market_id != market_id:
        return None, None, "Outcome does not belong to this market"

    return market, outcome, None


def get_user_wallet(user_id):
    wallet = Wallet.query.filter_by(user_id=user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=1000.0)
        db.session.add(wallet)
        db.session.commit()
    return wallet


def deduct_stake(wallet, stake):
    if wallet.balance < stake:
        return False, "Insufficient balance"

    wallet.balance -= stake

    transaction = Transaction(
        wallet_id=wallet.id,
        type="BET_PLACED",
        amount=-stake,
        status="completed"
    )
    db.session.add(transaction)
    db.session.commit()

    return True, None


def place_bet(user_id, market_id, outcome_id, side, stake, odds, wallet_address=None):
    valid, error = validate_bet_request({
        "market_id": market_id,
        "outcome_id": outcome_id,
        "side": side,
        "stake": stake,
        "odds": odds
    })

    if not valid:
        return None, error

    market, outcome, error = get_market_and_outcome(market_id, outcome_id)
    if error:
        return None, error

    wallet = get_user_wallet(user_id)
    success, error = deduct_stake(wallet, stake)
    if not success:
        return None, error

    bet = Bet(
        user_id=user_id,
        market_id=market_id,
        outcome_id=outcome_id,
        side=side,
        stake=stake,
        odds=odds,
        remaining_amount=stake,
        status="OPEN",
        potential_payout=stake * odds if side == "BACK" else stake,
        wallet_address=wallet_address
    )

    db.session.add(bet)
    db.session.flush()

    if wallet_address:
        user = User.query.get(user_id)
        transfer_tx = Transaction(
            wallet_id=wallet.id,
            type="NFT_TRANSFER",
            amount=stake,
            status="completed",
            from_wallet_address=wallet_address,
            to_wallet_address=Config.ADMIN_WALLET_ADDRESS,
            bet_id=bet.id
        )
        db.session.add(transfer_tx)

    db.session.commit()

    run_matching_engine(market_id, outcome_id)

    traders = ["Alex", "Maria", "James", "Emma", "Ryan", "Sofia", "Chen", "Yuki", "Omar", "Lisa", "TraderBot_72", "MarketMaker_X"]
    trader = random.choice(traders)
    emit_live_activity({
        "type": "bet_placed",
        "trader": trader,
        "action": "backed" if side == "BACK" else "laid",
        "outcome": outcome.title,
        "odds": odds,
        "stake": stake,
        "timestamp": datetime.utcnow().isoformat()
    }, socketio)

    from app.bets.services import get_orderbook
    orderbook_data = get_orderbook(market_id)
    if orderbook_data:
        emit_market_update({
            "market_id": market_id,
            "orderbook": orderbook_data,
            "timestamp": datetime.utcnow().isoformat()
        }, socketio)
        emit_orderbook_update({
            "market_id": market_id,
            "orderbook": orderbook_data,
            "timestamp": datetime.utcnow().isoformat()
        }, socketio)

    wallet = get_user_wallet(user_id)
    socketio.emit("wallet_updated", {
        "user_id": user_id,
        "balance": wallet.balance,
        "timestamp": datetime.utcnow().isoformat()
    })

    return bet, None


def get_user_bets(user_id):
    bets = Bet.query.filter_by(user_id=user_id).order_by(Bet.created_at.desc()).all()

    result = []
    for bet in bets:
        market = Market.query.get(bet.market_id)
        outcome = MarketOutcome.query.get(bet.outcome_id)

        result.append({
            "id": bet.id,
            "market_id": bet.market_id,
            "market_title": market.title if market else "Unknown",
            "outcome_id": bet.outcome_id,
            "outcome_title": outcome.title if outcome else "Unknown",
            "side": bet.side,
            "stake": bet.stake,
            "odds": bet.odds,
            "matched_amount": bet.matched_amount,
            "remaining_amount": bet.remaining_amount,
            "status": bet.status,
            "potential_payout": bet.potential_payout,
            "created_at": bet.created_at.isoformat()
        })

    return result


def run_matching_engine(market_id, outcome_id):
    back_bets = Bet.query.filter(
        Bet.market_id == market_id,
        Bet.outcome_id == outcome_id,
        Bet.side == "BACK",
        Bet.status.in_(["OPEN", "PARTIAL"])
    ).order_by(Bet.odds.desc(), Bet.created_at.asc()).all()

    lay_bets = Bet.query.filter(
        Bet.market_id == market_id,
        Bet.outcome_id == outcome_id,
        Bet.side == "LAY",
        Bet.status.in_(["OPEN", "PARTIAL"])
    ).order_by(Bet.odds.asc(), Bet.created_at.asc()).all()

    for back_bet in back_bets:
        for lay_bet in lay_bets:
            if back_bet.remaining_amount <= 0 or lay_bet.remaining_amount <= 0:
                continue

            if back_bet.odds >= lay_bet.odds:
                match_amount = min(back_bet.remaining_amount, lay_bet.remaining_amount)

                back_bet.matched_amount += match_amount
                back_bet.remaining_amount -= match_amount

                lay_bet.matched_amount += match_amount
                lay_bet.remaining_amount -= match_amount

                if back_bet.remaining_amount == 0:
                    back_bet.status = "MATCHED"
                    emit_bet_matched({
                        "bet_id": back_bet.id,
                        "market_id": market_id,
                        "outcome_id": outcome_id,
                        "status": "MATCHED",
                        "matched_amount": back_bet.matched_amount,
                        "timestamp": datetime.utcnow().isoformat()
                    }, socketio)
                else:
                    back_bet.status = "PARTIAL"

                if lay_bet.remaining_amount == 0:
                    lay_bet.status = "MATCHED"
                    emit_bet_matched({
                        "bet_id": lay_bet.id,
                        "market_id": market_id,
                        "outcome_id": outcome_id,
                        "status": "MATCHED",
                        "matched_amount": lay_bet.matched_amount,
                        "timestamp": datetime.utcnow().isoformat()
                    }, socketio)

    db.session.commit()


def get_orderbook(market_id):
    market = Market.query.get(market_id)
    if not market:
        return None

    outcomes = MarketOutcome.query.filter_by(market_id=market_id).all()

    back_orders = {}
    lay_orders = {}

    for outcome in outcomes:
        bets = Bet.query.filter(
            Bet.market_id == market_id,
            Bet.outcome_id == outcome.id,
            Bet.status.in_(["OPEN", "PARTIAL"])
        ).all()

        for bet in bets:
            if bet.side == "BACK":
                if outcome.id not in back_orders:
                    back_orders[outcome.id] = {}
                if bet.odds not in back_orders[outcome.id]:
                    back_orders[outcome.id][bet.odds] = {"total_stake": 0, "count": 0}
                back_orders[outcome.id][bet.odds]["total_stake"] += bet.remaining_amount
                back_orders[outcome.id][bet.odds]["count"] += 1
            else:
                if outcome.id not in lay_orders:
                    lay_orders[outcome.id] = {}
                if bet.odds not in lay_orders[outcome.id]:
                    lay_orders[outcome.id][bet.odds] = {"total_stake": 0, "count": 0}
                lay_orders[outcome.id][bet.odds]["total_stake"] += bet.remaining_amount
                lay_orders[outcome.id][bet.odds]["count"] += 1

    result = {
        "market_id": market_id,
        "market_title": market.title,
        "outcomes": []
    }

    for outcome in outcomes:
        outcome_data = {
            "id": outcome.id,
            "title": outcome.title,
            "back_orders": [],
            "lay_orders": []
        }

        if outcome.id in back_orders:
            for odds, data in sorted(back_orders[outcome.id].items(), key=lambda x: float(x[0]), reverse=True):
                outcome_data["back_orders"].append({
                    "odds": float(odds),
                    "total_stake": round(data["total_stake"], 2),
                    "count": data["count"]
                })

        if outcome.id in lay_orders:
            for odds, data in sorted(lay_orders[outcome.id].items(), key=lambda x: float(x[0])):
                outcome_data["lay_orders"].append({
                    "odds": float(odds),
                    "total_stake": round(data["total_stake"], 2),
                    "count": data["count"]
                })

        result["outcomes"].append(outcome_data)

    return result


def get_user_positions(user_id):
    """
    Get user's current positions with PnL calculations
    """
    bets = Bet.query.filter(
        Bet.user_id == user_id,
        Bet.status.in_(["OPEN", "PARTIAL", "MATCHED"])
    ).all()

    positions_by_market = {}
    for bet in bets:
        market_id = bet.market_id
        if market_id not in positions_by_market:
            market = Market.query.get(market_id)
            positions_by_market[market_id] = {
                "market_id": market_id,
                "market_title": market.title if market else "Unknown",
                "market_status": market.status if market else "Unknown",
                "positions": []
            }

        if bet.side == "BACK":
            unrealized_pnl = (bet.remaining_amount * bet.odds - bet.remaining_amount) if bet.remaining_amount > 0 else 0
        else:
            unrealized_pnl = 0

        positions_by_market[market_id]["positions"].append({
            "bet_id": bet.id,
            "outcome_id": bet.outcome_id,
            "side": bet.side,
            "stake": bet.stake,
            "odds": bet.odds,
            "matched_amount": bet.matched_amount,
            "remaining_amount": bet.remaining_amount,
            "unrealized_pnl": round(unrealized_pnl, 2),
            "status": bet.status
        })

    return list(positions_by_market.values())