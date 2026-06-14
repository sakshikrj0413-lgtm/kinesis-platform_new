from app.extensions import db
from datetime import datetime


class MarketInsight(db.Model):
    __tablename__ = "market_insights"

    id = db.Column(db.Integer, primary_key=True)
    market_id = db.Column(db.Integer, db.ForeignKey("markets.id"), nullable=False)
    edge_score = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    risk_label = db.Column(db.String(20), default="balanced")
    implied_probability = db.Column(db.Float, default=0.0)
    estimated_true_probability = db.Column(db.Float, default=0.0)
    sharp_money_detected = db.Column(db.Boolean, default=False)
    volume_score = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    market = db.relationship("Market", backref="insights")


class MarketSentiment(db.Model):
    __tablename__ = "market_sentiment"

    id = db.Column(db.Integer, primary_key=True)
    market_id = db.Column(db.Integer, db.ForeignKey("markets.id"), nullable=False)
    bullish_percentage = db.Column(db.Float, default=50.0)
    bearish_percentage = db.Column(db.Float, default=50.0)
    total_volume = db.Column(db.Float, default=0.0)
    unusual_activity_score = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    market = db.relationship("Market", backref="sentiments")
