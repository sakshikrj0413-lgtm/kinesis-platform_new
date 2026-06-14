from app.extensions import db
from datetime import datetime


class ArbitrageOpportunity(db.Model):
    __tablename__ = "arbitrage_opportunities"

    id = db.Column(db.Integer, primary_key=True)
    market_id = db.Column(db.Integer, db.ForeignKey("markets.id"), nullable=False)
    best_platform = db.Column(db.String(50), nullable=False)
    edge_percentage = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    guaranteed_profit = db.Column(db.Boolean, default=False)
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)

    market = db.relationship("Market", backref="arb_opportunities")


class PlatformOdds(db.Model):
    __tablename__ = "platform_odds"

    id = db.Column(db.Integer, primary_key=True)
    market_id = db.Column(db.Integer, db.ForeignKey("markets.id"), nullable=False)
    platform_name = db.Column(db.String(50), nullable=False)
    outcome_title = db.Column(db.String(100), nullable=False)
    odds = db.Column(db.Float, nullable=False)
    liquidity = db.Column(db.Float, default=0.0)
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)

    market = db.relationship("Market", backref="platform_odds")
