from datetime import datetime, timedelta
from collections import defaultdict

from app.extensions import db
from app.models.bet import Bet
from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.models.wallet import Wallet
from app.models.transaction import Transaction


def _get_wallet(user_id):
    return Wallet.query.filter_by(user_id=user_id).first()


def get_portfolio_summary(user_id):
    bets = Bet.query.filter_by(user_id=user_id).all()
    wallet = _get_wallet(user_id)

    total_bets = len(bets)
    matched_bets = len([b for b in bets if b.matched_amount and b.matched_amount > 0])
    active = [b for b in bets if b.status in ("OPEN", "PARTIAL", "MATCHED")]
    settled = [b for b in bets if b.status in ("WON", "LOST")]

    open_exposure = sum(b.remaining_amount or 0 for b in active if b.status in ("OPEN", "PARTIAL"))
    locked_liquidity = sum(b.remaining_amount or 0 for b in bets if b.status in ("OPEN", "PARTIAL"))

    realized_pnl = 0.0
    for b in settled:
        if b.status == "WON" and b.payout:
            realized_pnl += b.payout - b.matched_amount
        elif b.status == "LOST":
            realized_pnl -= b.matched_amount or b.stake

    unrealized_pnl = 0.0
    for b in active:
        if b.side == "BACK" and (b.remaining_amount or 0) > 0:
            unrealized_pnl += (b.remaining_amount * b.odds) - b.remaining_amount
        elif b.side == "LAY" and (b.remaining_amount or 0) > 0:
            unrealized_pnl -= (b.remaining_amount * (b.odds - 1))

    wins = len([b for b in settled if b.status == "WON"])
    losses = len([b for b in settled if b.status == "LOST"])
    win_rate = round((wins / len(settled) * 100), 2) if settled else 0.0

    total_staked = sum(b.stake for b in bets)
    roi = round((realized_pnl / total_staked * 100), 2) if total_staked > 0 else 0.0
    avg_odds = round(sum(b.odds for b in bets) / total_bets, 2) if total_bets else 0.0

    market_pnl = defaultdict(float)
    for b in bets:
        if b.status == "WON" and b.payout:
            market_pnl[b.market_id] += b.payout - (b.matched_amount or b.stake)
        elif b.status == "LOST":
            market_pnl[b.market_id] -= b.matched_amount or b.stake

    best_market_id = max(market_pnl, key=market_pnl.get) if market_pnl else None
    worst_market_id = min(market_pnl, key=market_pnl.get) if market_pnl else None

    def market_title(mid):
        m = Market.query.get(mid)
        return m.title if m else "Unknown"

    markets_participated = len(set(b.market_id for b in bets))

    return {
        "total_bets": total_bets,
        "matched_bets": matched_bets,
        "active_positions": len(active),
        "open_exposure": round(open_exposure, 2),
        "locked_liquidity": round(locked_liquidity, 2),
        "realized_pnl": round(realized_pnl, 2),
        "unrealized_pnl": round(unrealized_pnl, 2),
        "total_pnl": round(realized_pnl + unrealized_pnl, 2),
        "win_rate": win_rate,
        "wins": wins,
        "losses": losses,
        "roi_percent": roi,
        "average_odds": avg_odds,
        "total_staked": round(total_staked, 2),
        "markets_participated": markets_participated,
        "best_market": {"id": best_market_id, "title": market_title(best_market_id), "pnl": round(market_pnl.get(best_market_id, 0), 2)} if best_market_id else None,
        "worst_market": {"id": worst_market_id, "title": market_title(worst_market_id), "pnl": round(market_pnl.get(worst_market_id, 0), 2)} if worst_market_id else None,
        "wallet_balance": round(wallet.balance, 2) if wallet else 0.0,
        "available_liquidity": round((wallet.balance if wallet else 0) - locked_liquidity, 2),
        "pending_bets": len([b for b in bets if b.status in ("OPEN", "PARTIAL")]),
        "settled_bets": len(settled),
        "cancelled_bets": len([b for b in bets if b.status == "CANCELLED"]),
    }


def get_open_positions(user_id):
    bets = Bet.query.filter(
        Bet.user_id == user_id,
        Bet.status.in_(["OPEN", "PARTIAL", "MATCHED"])
    ).order_by(Bet.created_at.desc()).all()

    positions = []
    for bet in bets:
        market = Market.query.get(bet.market_id)
        outcome = MarketOutcome.query.get(bet.outcome_id)

        if bet.side == "BACK" and (bet.remaining_amount or 0) > 0:
            unrealized = (bet.remaining_amount * bet.odds) - bet.remaining_amount
        elif bet.side == "LAY" and (bet.remaining_amount or 0) > 0:
            unrealized = -(bet.remaining_amount * (bet.odds - 1))
        else:
            unrealized = (bet.matched_amount * bet.odds - bet.matched_amount) if bet.side == "BACK" and bet.matched_amount else 0

        positions.append({
            "bet_id": bet.id,
            "market_id": bet.market_id,
            "market_title": market.title if market else "Unknown",
            "market_status": market.status if market else "Unknown",
            "outcome_id": bet.outcome_id,
            "outcome_title": outcome.title if outcome else "Unknown",
            "side": bet.side,
            "stake": bet.stake,
            "odds": bet.odds,
            "live_odds": outcome.odds if outcome else bet.odds,
            "matched_amount": bet.matched_amount or 0,
            "remaining_amount": bet.remaining_amount or 0,
            "exposure": round(bet.remaining_amount or bet.stake, 2),
            "unrealized_pnl": round(unrealized, 2),
            "status": bet.status,
            "potential_payout": bet.potential_payout,
            "created_at": bet.created_at.isoformat(),
        })

    return positions


def get_portfolio_history(user_id):
    bets = Bet.query.filter_by(user_id=user_id).order_by(Bet.created_at.desc()).all()

    history = []
    for bet in bets:
        market = Market.query.get(bet.market_id)
        outcome = MarketOutcome.query.get(bet.outcome_id)

        pnl = None
        if bet.status == "WON" and bet.payout:
            pnl = round(bet.payout - (bet.matched_amount or bet.stake), 2)
        elif bet.status == "LOST":
            pnl = round(-(bet.matched_amount or bet.stake), 2)

        history.append({
            "bet_id": bet.id,
            "market_id": bet.market_id,
            "market_title": market.title if market else "Unknown",
            "market_status": market.status if market else "Unknown",
            "outcome_title": outcome.title if outcome else "Unknown",
            "side": bet.side,
            "stake": bet.stake,
            "odds": bet.odds,
            "matched_amount": bet.matched_amount or 0,
            "status": bet.status,
            "result": bet.result,
            "payout": bet.payout,
            "pnl": pnl,
            "created_at": bet.created_at.isoformat(),
        })

    return history


def get_portfolio_performance(user_id):
    bets = Bet.query.filter_by(user_id=user_id).order_by(Bet.created_at.asc()).all()

    pnl_timeline = []
    exposure_timeline = []
    cumulative_pnl = 0.0

    for bet in bets:
        day = bet.created_at.strftime("%Y-%m-%d")
        if bet.status == "WON" and bet.payout:
            cumulative_pnl += bet.payout - (bet.matched_amount or bet.stake)
        elif bet.status == "LOST":
            cumulative_pnl -= bet.matched_amount or bet.stake

        pnl_timeline.append({
            "date": day,
            "pnl": round(cumulative_pnl, 2),
            "bet_id": bet.id,
        })

        exposure_timeline.append({
            "date": day,
            "exposure": round(sum(
                (b.remaining_amount or 0) for b in bets
                if b.created_at <= bet.created_at and b.status in ("OPEN", "PARTIAL", "MATCHED")
            ), 2),
        })

    market_participation = defaultdict(lambda: {"bets": 0, "volume": 0.0, "pnl": 0.0})
    for bet in bets:
        market_participation[bet.market_id]["bets"] += 1
        market_participation[bet.market_id]["volume"] += bet.stake
        if bet.status == "WON" and bet.payout:
            market_participation[bet.market_id]["pnl"] += bet.payout - (bet.matched_amount or bet.stake)
        elif bet.status == "LOST":
            market_participation[bet.market_id]["pnl"] -= bet.matched_amount or bet.stake

    markets = []
    for mid, data in market_participation.items():
        m = Market.query.get(mid)
        markets.append({
            "market_id": mid,
            "title": m.title if m else "Unknown",
            "bets": data["bets"],
            "volume": round(data["volume"], 2),
            "pnl": round(data["pnl"], 2),
        })

    wins = len([b for b in bets if b.status == "WON"])
    losses = len([b for b in bets if b.status == "LOST"])

    wallet = _get_wallet(user_id)
    transactions = []
    if wallet:
        txs = Transaction.query.filter_by(wallet_id=wallet.id).order_by(Transaction.created_at.desc()).limit(50).all()
        transactions = [{
            "id": t.id,
            "type": t.type,
            "amount": t.amount,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
        } for t in txs]

    return {
        "pnl_timeline": pnl_timeline[-30:],
        "exposure_timeline": exposure_timeline[-30:],
        "market_participation": markets,
        "win_loss_ratio": {"wins": wins, "losses": losses},
        "liquidity_allocation": [
            {"side": "BACK", "amount": round(sum(b.stake for b in bets if b.side == "BACK"), 2)},
            {"side": "LAY", "amount": round(sum(b.stake for b in bets if b.side == "LAY"), 2)},
        ],
        "transactions": transactions,
    }
