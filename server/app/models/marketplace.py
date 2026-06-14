from app.extensions import db
from datetime import datetime


class MarketplaceAgent(db.Model):
    __tablename__ = "marketplace_agents"

    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey("agents.id"), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    roi = db.Column(db.Float, default=0.0)
    win_rate = db.Column(db.Float, default=0.0)
    total_users = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0.0)
    rating_count = db.Column(db.Integer, default=0)
    public = db.Column(db.Boolean, default=True)
    strategy_type = db.Column(db.String(50), default="edge_hunter")
    sport = db.Column(db.String(50), default="all")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    agent = db.relationship("Agent", backref="marketplace_listing")
    creator = db.relationship("User", backref="marketplace_agents")
    ratings = db.relationship("MarketplaceRating", backref="marketplace_agent", cascade="all, delete-orphan")


class MarketplaceRating(db.Model):
    __tablename__ = "marketplace_ratings"

    id = db.Column(db.Integer, primary_key=True)
    marketplace_agent_id = db.Column(db.Integer, db.ForeignKey("marketplace_agents.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    review = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")
