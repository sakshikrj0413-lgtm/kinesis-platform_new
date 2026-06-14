from app.extensions import db
from datetime import datetime


class Bet(db.Model):

    __tablename__ = "bets"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    market_id = db.Column(
        db.Integer,
        db.ForeignKey("markets.id"),
        nullable=False
    )

    outcome_id = db.Column(
        db.Integer,
        db.ForeignKey("market_outcomes.id"),
        nullable=False
    )

    wallet_address = db.Column(
        db.String(42),
        nullable=True
    )

    side = db.Column(
        db.String(10),
        nullable=False
    )  # BACK or LAY

    stake = db.Column(
        db.Float,
        nullable=False
    )

    odds = db.Column(
        db.Float,
        nullable=False
    )

    matched_amount = db.Column(
        db.Float,
        default=0
    )

    remaining_amount = db.Column(
        db.Float
    )

    status = db.Column(
        db.String(20),
        default="OPEN"
    )  # OPEN, PARTIAL, MATCHED, WON, LOST, CANCELLED

    potential_payout = db.Column(
        db.Float
    )

    result = db.Column(
        db.String(20)
    )  # 'won', 'lost', 'cancelled'

    payout = db.Column(
        db.Float
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user = db.relationship("User", backref="bets")
    market = db.relationship("Market", backref="bets")
    outcome = db.relationship("MarketOutcome", backref="bets")