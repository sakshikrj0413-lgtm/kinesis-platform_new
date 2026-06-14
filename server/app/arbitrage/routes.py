from flask import jsonify, request
from flask_jwt_extended import jwt_required
from app.arbitrage import arb_bp
from app.arbitrage.engine import engine
from app.models.market import Market
from app.models.market_outcome import MarketOutcome
from app.middleware.auth_middleware import user_required


@arb_bp.route("/opportunities", methods=["GET"])
@jwt_required()
@user_required
def get_opportunities():
    markets = Market.query.filter_by(status="OPEN").all()

    markets_data = []
    for m in markets:
        outcomes = MarketOutcome.query.filter_by(market_id=m.id).all()
        markets_data.append({
            "id": m.id,
            "title": m.title,
            "outcomes": [{"title": o.title, "odds": o.odds} for o in outcomes],
        })

    opportunities = engine.scan_all(markets_data)
    return jsonify({"opportunities": opportunities})


@arb_bp.route("/live", methods=["GET"])
@jwt_required()
@user_required
def get_live():
    markets = Market.query.filter_by(status="OPEN").limit(10).all()

    markets_data = []
    for m in markets:
        outcomes = MarketOutcome.query.filter_by(market_id=m.id).all()
        markets_data.append({
            "id": m.id,
            "title": m.title,
            "outcomes": [{"title": o.title, "odds": o.odds} for o in outcomes],
        })

    opportunities = engine.scan_all(markets_data)
    return jsonify({
        "live": opportunities,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
    })


@arb_bp.route("/market/<int:market_id>", methods=["GET"])
@jwt_required()
@user_required
def get_market_arb(market_id):
    market = Market.query.get(market_id)
    if not market:
        return jsonify({"error": "Market not found"}), 404

    outcomes = MarketOutcome.query.filter_by(market_id=market_id).all()
    result = engine.scan_market(market_id, market.title, [{"title": o.title, "odds": o.odds} for o in outcomes])

    return jsonify(result)
