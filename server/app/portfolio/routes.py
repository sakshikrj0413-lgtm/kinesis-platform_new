from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.portfolio.services import (
    get_portfolio_summary,
    get_open_positions,
    get_portfolio_history,
    get_portfolio_performance,
)
from app.middleware.auth_middleware import user_required

portfolio_bp = Blueprint("portfolio", __name__)


@portfolio_bp.route("/summary", methods=["GET"])
@jwt_required()
@user_required
def summary():
    user_id = get_jwt_identity()
    return get_portfolio_summary(user_id), 200


@portfolio_bp.route("/open-positions", methods=["GET"])
@jwt_required()
@user_required
def open_positions():
    user_id = get_jwt_identity()
    return {"positions": get_open_positions(user_id)}, 200


@portfolio_bp.route("/history", methods=["GET"])
@jwt_required()
@user_required
def history():
    user_id = get_jwt_identity()
    return {"history": get_portfolio_history(user_id)}, 200


@portfolio_bp.route("/performance", methods=["GET"])
@jwt_required()
@user_required
def performance():
    user_id = get_jwt_identity()
    return get_portfolio_performance(user_id), 200
