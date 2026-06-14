from app.extensions import db
from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.models.bet import Bet


def create_market(data, user_id):
    required_fields = ["title", "description", "type", "outcomes"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    if not data["outcomes"] or not isinstance(data["outcomes"], list):
        raise ValueError("outcomes must be a non-empty list")

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
        if "title" not in outcome:
            raise ValueError("Each outcome must have a title")

        market_outcome = MarketOutcome(
            market_id=market.id,
            title=outcome["title"],
            odds=outcome.get("odds", 1.5)
        )

        db.session.add(market_outcome)
        outcomes.append(market_outcome)

    db.session.commit()

    return market, outcomes


def get_orderbook(market_id):
    """
    Get the order book for a market including all outcomes and their orders.
    """
    market = Market.query.get(market_id)
    
    if not market:
        return None
    
    outcomes = MarketOutcome.query.filter_by(market_id=market_id).all()
    bets = Bet.query.filter_by(market_id=market_id).all()
    
    # Organize bets by outcome and side
    orders_by_outcome = {}
    for outcome in outcomes:
        orders_by_outcome[outcome.id] = {
            "back": [],
            "lay": []
        }
    
    for bet in bets:
        if bet.outcome_id in orders_by_outcome:
            orders_by_outcome[bet.outcome_id][bet.side.lower()].append({
                "user_id": bet.user_id,
                "stake": bet.stake,
                "odds": bet.odds,
                "matched_amount": bet.matched_amount
            })
    
    return {
        "market_id": market.id,
        "title": market.title,
        "description": market.description,
        "type": market.type,
        "status": market.status,
        "outcomes": [
            {
                "id": outcome.id,
                "title": outcome.title,
                "odds": outcome.odds,
                "orders": orders_by_outcome.get(outcome.id, {"back": [], "lay": []})
            }
            for outcome in outcomes
        ]
    }