import json
from datetime import datetime
from app.extensions import db
from app.models.agent import Agent, AgentRule, AgentLog, AgentPosition


def create_agent(user_id, name, sport, strategy, min_edge, max_stake, daily_loss_limit, rules=None):
    agent = Agent(
        user_id=user_id,
        name=name,
        sport=sport,
        strategy=strategy,
        min_edge=min_edge,
        max_stake=max_stake,
        daily_loss_limit=daily_loss_limit,
    )
    db.session.add(agent)
    db.session.flush()

    rule_data = rules or {}
    rule = AgentRule(
        agent_id=agent.id,
        max_odds=rule_data.get("max_odds", 0.95),
        min_odds=rule_data.get("min_odds", 0.05),
        cooldown_seconds=rule_data.get("cooldown_seconds", 60),
        stop_loss=rule_data.get("stop_loss", 100.0),
        allowed_market_types=rule_data.get("allowed_market_types", "BINARY,MULTI"),
    )
    db.session.add(rule)

    log = AgentLog(
        agent_id=agent.id,
        event_type="created",
        message=f"Agent '{name}' created with strategy: {strategy}",
    )
    db.session.add(log)

    db.session.commit()

    return agent


def start_agent(agent_id):
    agent = Agent.query.get(agent_id)
    if not agent:
        return None, "Agent not found"

    agent.status = "running"
    db.session.commit()

    log = AgentLog(
        agent_id=agent_id,
        event_type="started",
        message=f"Agent '{agent.name}' started",
    )
    db.session.add(log)
    db.session.commit()

    return agent, None


def stop_agent(agent_id):
    agent = Agent.query.get(agent_id)
    if not agent:
        return None, "Agent not found"

    agent.status = "stopped"
    db.session.commit()

    log = AgentLog(
        agent_id=agent_id,
        event_type="stopped",
        message=f"Agent '{agent.name}' stopped",
    )
    db.session.add(log)
    db.session.commit()

    return agent, None


def get_agent(agent_id, user_id):
    agent = Agent.query.filter_by(id=agent_id, user_id=user_id).first()
    return agent


def get_user_agents(user_id):
    agents = Agent.query.filter_by(user_id=user_id).order_by(Agent.created_at.desc()).all()
    return agents


def get_agent_logs(agent_id, user_id, limit=50):
    agent = Agent.query.filter_by(id=agent_id, user_id=user_id).first()
    if not agent:
        return None

    logs = AgentLog.query.filter_by(agent_id=agent_id).order_by(
        AgentLog.created_at.desc()
    ).limit(limit).all()

    return logs


def get_agent_positions(agent_id, user_id):
    agent = Agent.query.filter_by(id=agent_id, user_id=user_id).first()
    if not agent:
        return None

    positions = AgentPosition.query.filter_by(agent_id=agent_id).order_by(
        AgentPosition.created_at.desc()
    ).all()

    return positions


def add_agent_log(agent_id, event_type, message, data=None):
    log = AgentLog(
        agent_id=agent_id,
        event_type=event_type,
        message=message,
        data=json.dumps(data) if data else None,
    )
    db.session.add(log)
    db.session.commit()
    return log


def update_agent_performance(agent_id, profit, trade_won):
    agent = Agent.query.get(agent_id)
    if not agent:
        return

    agent.total_profit += profit
    agent.total_trades += 1
    if trade_won:
        agent.winning_trades += 1

    if agent.total_trades > 0:
        agent.win_rate = round((agent.winning_trades / agent.total_trades) * 100, 2)
        total_staked = agent.total_trades * agent.max_stake
        if total_staked > 0:
            agent.roi = round((agent.total_profit / total_staked) * 100, 2)

    db.session.commit()
