from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.marketplace import marketplace_bp
from app.marketplace.services import (
    publish_agent,
    clone_agent,
    get_agents,
    rate_agent,
    get_leaderboard,
)
from app.middleware.auth_middleware import user_required


@marketplace_bp.route("/publish", methods=["POST"])
@jwt_required()
@user_required
def publish():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    agent_id = data.get("agent_id")
    title = data.get("title")
    description = data.get("description", "")
    public = data.get("public", True)

    if not agent_id or not title:
        return jsonify({"error": "agent_id and title are required"}), 400

    listing, error = publish_agent(agent_id, current_user_id, title, description, public)
    if error:
        return jsonify({"error": error}), 404

    return jsonify({
        "message": "Agent published to marketplace",
        "listing": {
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "roi": listing.roi,
            "win_rate": listing.win_rate,
            "total_users": listing.total_users,
            "rating": listing.rating,
            "public": listing.public,
        }
    }), 201


@marketplace_bp.route("/clone/<int:listing_id>", methods=["POST"])
@jwt_required()
@user_required
def clone(listing_id):
    current_user_id = get_jwt_identity()

    agent, error = clone_agent(listing_id, current_user_id)
    if error:
        return jsonify({"error": error}), 404

    return jsonify({
        "message": "Agent cloned successfully",
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "sport": agent.sport,
            "strategy": agent.strategy,
            "status": agent.status,
        }
    }), 201


@marketplace_bp.route("/agents", methods=["GET"])
@jwt_required()
@user_required
def list_agents():
    sort_by = request.args.get("sort", "roi")
    limit = request.args.get("limit", 20, type=int)

    agents = get_agents(sort_by=sort_by, limit=limit)

    return jsonify({
        "agents": [{
            "id": a.id,
            "agent_id": a.agent_id,
            "title": a.title,
            "description": a.description,
            "roi": a.roi,
            "win_rate": a.win_rate,
            "total_users": a.total_users,
            "rating": a.rating,
            "rating_count": a.rating_count,
            "strategy_type": a.strategy_type,
            "sport": a.sport,
            "creator_id": a.creator_id,
            "created_at": a.created_at.isoformat(),
        } for a in agents]
    })


@marketplace_bp.route("/agents/<int:listing_id>", methods=["GET"])
@jwt_required()
@user_required
def get_agent(listing_id):
    from app.models.marketplace import MarketplaceAgent
    listing = MarketplaceAgent.query.get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    from app.models.marketplace import MarketplaceRating
    ratings = MarketplaceRating.query.filter_by(
        marketplace_agent_id=listing_id
    ).order_by(MarketplaceRating.created_at.desc()).limit(10).all()

    return jsonify({
        "listing": {
            "id": listing.id,
            "agent_id": listing.agent_id,
            "title": listing.title,
            "description": listing.description,
            "roi": listing.roi,
            "win_rate": listing.win_rate,
            "total_users": listing.total_users,
            "rating": listing.rating,
            "rating_count": listing.rating_count,
            "strategy_type": listing.strategy_type,
            "sport": listing.sport,
            "creator_id": listing.creator_id,
            "created_at": listing.created_at.isoformat(),
        },
        "ratings": [{
            "id": r.id,
            "user_id": r.user_id,
            "rating": r.rating,
            "review": r.review,
            "created_at": r.created_at.isoformat(),
        } for r in ratings]
    })


@marketplace_bp.route("/rate/<int:listing_id>", methods=["POST"])
@jwt_required()
@user_required
def rate(listing_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()

    rating = data.get("rating")
    review = data.get("review")

    if not rating or not (1 <= rating <= 5):
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    rate_agent(listing_id, current_user_id, rating, review)

    return jsonify({"message": "Rating submitted"})


@marketplace_bp.route("/leaderboard", methods=["GET"])
@jwt_required()
@user_required
def leaderboard():
    data = get_leaderboard()

    def serialize(agents):
        return [{
            "id": a.id,
            "title": a.title,
            "roi": a.roi,
            "win_rate": a.win_rate,
            "total_users": a.total_users,
            "rating": a.rating,
            "strategy_type": a.strategy_type,
            "sport": a.sport,
        } for a in agents]

    return jsonify({
        "top_roi": serialize(data["top_roi"]),
        "trending": serialize(data["trending"]),
        "safest": serialize(data["safest"]),
    })
