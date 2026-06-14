from app.extensions import db


class MarketOutcome(db.Model):

    __tablename__ = "market_outcomes"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    market_id = db.Column(
        db.Integer,
        db.ForeignKey("markets.id"),
        nullable=False
    )

    title = db.Column(
        db.String(100),
        nullable=False
    )

    odds = db.Column(
        db.Float,
        default=1.5
    )

    betting_price = db.Column(
        db.Float,
        default=0.001
    )