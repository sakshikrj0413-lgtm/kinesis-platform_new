import json
from datetime import datetime
from app.extensions import db
from app.models.agent import Agent, AgentRule, AgentLog, AgentPosition
from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.models.bet import Bet
from app.models.wallet import Wallet
from app.intelligence.services import compute_market_intelligence


def execute_agent_cycle(agent_id, socketio=None):
    agent = Agent.query.get(agent_id)
    if not agent or agent.status != "running":
        return

    rule = AgentRule.query.filter_by(agent_id=agent_id, active=True).first()
    if not rule:
        return

    _log(agent_id, "cycle_start", f"Scanning markets for agent '{agent.name}'")

    markets = Market.query.filter_by(status="OPEN").all()
    opportunities = []

    for market in markets:
        if agent.sport != "all" and agent.sport.lower() not in market.title.lower():
            continue

        market_types = rule.allowed_market_types.split(",")
        if market.type not in market_types:
            continue

        already_bet = AgentPosition.query.filter_by(
            agent_id=agent_id, market_id=market.id, status="open"
        ).first()
        if already_bet:
            continue

        intelligence = compute_market_intelligence(market.id)
        if not intelligence:
            continue

        edge = intelligence["edge"]
        confidence = intelligence["confidence"]
        risk = intelligence["risk"]

        if edge < agent.min_edge:
            _log(agent_id, "skipped",
                 f"Skipped '{market.title}' — edge {edge:.1f}% < min {agent.min_edge}%")
            continue

        if risk == "degen":
            _log(agent_id, "skipped",
                 f"Skipped '{market.title}' — risk too high (degen)")
            continue

        if confidence < 40:
            _log(agent_id, "skipped",
                 f"Skipped '{market.title}' — confidence {confidence:.0f}% too low")
            continue

        opportunities.append({
            "market": market,
            "intelligence": intelligence,
            "edge": edge,
            "confidence": confidence,
        })

    if not opportunities:
        _log(agent_id, "no_opportunities", "No suitable opportunities found this cycle")
        return

    opportunities.sort(key=lambda x: x["edge"], reverse=True)
    max_bets = min(len(opportunities), 3)

    for i in range(max_bets):
        opp = opportunities[i]
        market = opp["market"]
        intelligence = opp["intelligence"]

        outcomes = MarketOutcome.query.filter_by(market_id=market.id).all()
        if not outcomes:
            continue

        target_outcome = max(outcomes, key=lambda o: o.odds)
        odds = target_outcome.odds

        if odds < rule.min_odds or odds > rule.max_odds:
            _log(agent_id, "skipped_odds",
                 f"Odds {odds:.2f} outside rule range [{rule.min_odds}, {rule.max_odds}]")
            continue

        stake = min(agent.max_stake, agent.max_stake * (intelligence["confidence"] / 100))
        stake = round(stake, 2)

        wallet = Wallet.query.filter_by(user_id=agent.user_id).first()
        if not wallet or wallet.balance < stake:
            _log(agent_id, "insufficient_funds",
                 f"Insufficient funds for stake {stake} on '{market.title}'")
            continue

        side = "BACK"
        bet = Bet(
            user_id=agent.user_id,
            market_id=market.id,
            outcome_id=target_outcome.id,
            side=side,
            stake=stake,
            odds=odds,
            matched_amount=stake,
            remaining_amount=0,
            status="MATCHED",
            potential_payout=round(stake * (1 / odds), 2),
        )
        db.session.add(bet)

        wallet.balance -= stake

        position = AgentPosition(
            agent_id=agent_id,
            market_id=market.id,
            stake=stake,
            side=side,
            odds=odds,
            status="open",
            pnl=0,
        )
        db.session.add(position)

        _log(agent_id, "edge_detected",
             f"EDGE: {market.title} — +{intelligence['edge']:.1f}% edge, "
             f"{intelligence['confidence']:.0f}% confidence")
        _log(agent_id, "bet_placed",
             f"BET PLACED: {stake} GU on {target_outcome.title} @ {odds:.2f} "
             f"(market #{market.id})")

        db.session.commit()

        if socketio:
            socketio.emit("agent_bet", {
                "agent_id": agent_id,
                "agent_name": agent.name,
                "market_id": market.id,
                "market_title": market.title,
                "outcome": target_outcome.title,
                "stake": stake,
                "odds": odds,
                "edge": intelligence["edge"],
                "side": side,
            })


def _log(agent_id, event_type, message, data=None):
    log = AgentLog(
        agent_id=agent_id,
        event_type=event_type,
        message=message,
        data=json.dumps(data) if data else None,
    )
    db.session.add(log)
    db.session.commit()
