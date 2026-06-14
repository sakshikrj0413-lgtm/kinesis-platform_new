from app.extensions import db
from datetime import datetime


class Market(db.Model):

    __tablename__ = "markets"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    title = db.Column(
        db.String(255),
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    type = db.Column(
        db.String(50),
        nullable=False
    )

    status = db.Column(
        db.String(50),
        default="OPEN"
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    resolved_at = db.Column(
        db.DateTime
    )

    winning_outcome_id = db.Column(
        db.Integer
    )