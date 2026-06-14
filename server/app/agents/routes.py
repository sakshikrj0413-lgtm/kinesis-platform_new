from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.agents import agents_bp
from app.agents.services import (
    create_agent,
    start_agent,
    stop_agent,
    get_agent,
    get_user_agents,
    get_agent_logs,
    get_agent_positions,
)
from app.middleware.auth_middleware import user_required
from app.agents.executor import execute_agent_cycle


@agents_bp.route("/create", methods=["POST"])
@jwt_required()
@user_required
def create():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    name = data.get("name")
    sport = data.get("sport", "all")
    strategy = data.get("strategy", "edge_hunter")
    min_edge = data.get("minEdge", 3.0)
    max_stake = data.get("maxStake", 50.0)
    daily_loss_limit = data.get("dailyLossLimit", 200.0)
    rules = data.get("rules", {})

    if not name:
        return jsonify({"error": "Agent name is required"}), 400

    agent = create_agent(
        user_id=current_user_id,
        name=name,
        sport=sport,
        strategy=strategy,
        min_edge=min_edge,
        max_stake=max_stake,
        daily_loss_limit=daily_loss_limit,
        rules=rules,
    )

    return jsonify({
        "message": "Agent created successfully",
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "sport": agent.sport,
            "status": agent.status,
            "strategy": agent.strategy,
            "min_edge": agent.min_edge,
            "max_stake": agent.max_stake,
            "daily_loss_limit": agent.daily_loss_limit,
        }
    }), 201


@agents_bp.route("/start", methods=["POST"])
@jwt_required()
@user_required
def start():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    agent_id = data.get("agent_id")

    if not agent_id:
        return jsonify({"error": "agent_id is required"}), 400

    agent = get_agent(agent_id, current_user_id)
    if not agent:
        return jsonify({"error": "Agent not found"}), 404

    agent, error = start_agent(agent_id)
    if error:
        return jsonify({"error": error}), 400

    from app.agents.scheduler import scheduler
    if not scheduler._running:
        from app import create_app
        from app.extensions import socketio
        scheduler.start(socketio)

    return jsonify({
        "message": "Agent started",
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "status": agent.status,
        }
    })


@agents_bp.route("/stop", methods=["POST"])
@jwt_required()
@user_required
def stop():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    agent_id = data.get("agent_id")

    if not agent_id:
        return jsonify({"error": "agent_id is required"}), 400

    agent = get_agent(agent_id, current_user_id)
    if not agent:
        return jsonify({"error": "Agent not found"}), 404

    agent, error = stop_agent(agent_id)
    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Agent stopped",
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "status": agent.status,
        }
    })


@agents_bp.route("/my", methods=["GET"])
@jwt_required()
@user_required
def my_agents():
    current_user_id = get_jwt_identity()
    agents = get_user_agents(current_user_id)

    return jsonify({
        "agents": [{
            "id": a.id,
            "name": a.name,
            "sport": a.sport,
            "status": a.status,
            "strategy": a.strategy,
            "min_edge": a.min_edge,
            "max_stake": a.max_stake,
            "daily_loss_limit": a.daily_loss_limit,
            "total_profit": a.total_profit,
            "roi": a.roi,
            "win_rate": a.win_rate,
            "total_trades": a.total_trades,
            "created_at": a.created_at.isoformat(),
        } for a in agents]
    })


@agents_bp.route("/<int:agent_id>", methods=["GET"])
@jwt_required()
@user_required
def get(agent_id):
    current_user_id = get_jwt_identity()
    agent = get_agent(agent_id, current_user_id)

    if not agent:
        return jsonify({"error": "Agent not found"}), 404

    return jsonify({
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "sport": agent.sport,
            "status": agent.status,
            "strategy": agent.strategy,
            "min_edge": agent.min_edge,
            "max_stake": agent.max_stake,
            "daily_loss_limit": agent.daily_loss_limit,
            "total_profit": agent.total_profit,
            "roi": agent.roi,
            "win_rate": agent.win_rate,
            "total_trades": agent.total_trades,
            "created_at": agent.created_at.isoformat(),
        }
    })


@agents_bp.route("/<int:agent_id>/logs", methods=["GET"])
@jwt_required()
@user_required
def logs(agent_id):
    current_user_id = get_jwt_identity()
    limit = request.args.get("limit", 50, type=int)
    agent_logs = get_agent_logs(agent_id, current_user_id, limit=limit)

    if agent_logs is None:
        return jsonify({"error": "Agent not found"}), 404

    return jsonify({
        "logs": [{
            "id": l.id,
            "event_type": l.event_type,
            "message": l.message,
            "data": l.data,
            "created_at": l.created_at.isoformat(),
        } for l in agent_logs]
    })


@agents_bp.route("/<int:agent_id>/positions", methods=["GET"])
@jwt_required()
@user_required
def positions(agent_id):
    current_user_id = get_jwt_identity()
    agent_positions = get_agent_positions(agent_id, current_user_id)

    if agent_positions is None:
        return jsonify({"error": "Agent not found"}), 404

    return jsonify({
        "positions": [{
            "id": p.id,
            "market_id": p.market_id,
            "stake": p.stake,
            "side": p.side,
            "odds": p.odds,
            "pnl": p.pnl,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        } for p in agent_positions]
    })


@agents_bp.route("/<int:agent_id>/run", methods=["POST"])
@jwt_required()
@user_required
def run_once(agent_id):
    current_user_id = get_jwt_identity()
    agent = get_agent(agent_id, current_user_id)

    if not agent:
        return jsonify({"error": "Agent not found"}), 404

    from app.extensions import socketio
    execute_agent_cycle(agent_id, socketio)

    return jsonify({"message": "Agent cycle executed"})
