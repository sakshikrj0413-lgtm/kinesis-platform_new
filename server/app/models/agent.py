from app.extensions import db
from datetime import datetime


class Agent(db.Model):
    __tablename__ = "agents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    sport = db.Column(db.String(50), default="all")
    status = db.Column(db.String(20), default="stopped")
    strategy = db.Column(db.String(50), default="edge_hunter")
    min_edge = db.Column(db.Float, default=3.0)
    max_stake = db.Column(db.Float, default=50.0)
    daily_loss_limit = db.Column(db.Float, default=200.0)
    total_profit = db.Column(db.Float, default=0.0)
    roi = db.Column(db.Float, default=0.0)
    win_rate = db.Column(db.Float, default=0.0)
    total_trades = db.Column(db.Integer, default=0)
    winning_trades = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="agents")
    rules = db.relationship("AgentRule", backref="agent", cascade="all, delete-orphan")
    logs = db.relationship("AgentLog", backref="agent", cascade="all, delete-orphan")
    positions = db.relationship("AgentPosition", backref="agent", cascade="all, delete-orphan")


class AgentRule(db.Model):
    __tablename__ = "agent_rules"

    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey("agents.id"), nullable=False)
    max_odds = db.Column(db.Float, default=0.95)
    min_odds = db.Column(db.Float, default=0.05)
    cooldown_seconds = db.Column(db.Integer, default=60)
    stop_loss = db.Column(db.Float, default=100.0)
    allowed_market_types = db.Column(db.String(255), default="BINARY,MULTI")
    active = db.Column(db.Boolean, default=True)


class AgentLog(db.Model):
    __tablename__ = "agent_logs"

    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey("agents.id"), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    data = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class AgentPosition(db.Model):
    __tablename__ = "agent_positions"

    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey("agents.id"), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey("markets.id"), nullable=False)
    stake = db.Column(db.Float, nullable=False)
    side = db.Column(db.String(10), nullable=False)
    odds = db.Column(db.Float, nullable=False)
    pnl = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default="open")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    market = db.relationship("Market", backref="agent_positions")
