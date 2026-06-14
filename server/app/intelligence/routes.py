from flask import jsonify, request
from flask_jwt_extended import jwt_required
from app.intelligence import intelligence_bp
from app.intelligence.services import (
    compute_market_intelligence,
    get_trending_markets,
)
from app.middleware.auth_middleware import user_required


@intelligence_bp.route("/markets/<int:market_id>/edge", methods=["GET"])
@jwt_required()
@user_required
def get_market_edge(market_id):
    result = compute_market_intelligence(market_id)
    if not result:
        return jsonify({"error": "Market not found"}), 404

    return jsonify({
        "edge": result["edge"],
        "market_probability": result["market_probability"],
        "estimated_probability": result["estimated_probability"],
        "best_outcome": result["best_outcome"],
    })


@intelligence_bp.route("/markets/<int:market_id>/intelligence", methods=["GET"])
@jwt_required()
@user_required
def get_market_intelligence(market_id):
    result = compute_market_intelligence(market_id)
    if not result:
        return jsonify({"error": "Market not found"}), 404

    return jsonify(result)


@intelligence_bp.route("/markets/trending", methods=["GET"])
@jwt_required()
@user_required
def get_trending():
    limit = request.args.get("limit", 10, type=int)
    trending = get_trending_markets(limit=limit)
    return jsonify({"trending": trending})
