from app.extensions import db
from datetime import datetime

class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)

    wallet_id = db.Column(
        db.Integer,
        db.ForeignKey("wallets.id")
    )

    type = db.Column(db.String(20))

    amount = db.Column(db.Float)

    status = db.Column(db.String(20), default="completed")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    from_wallet_address = db.Column(db.String(42), nullable=True)
    to_wallet_address = db.Column(db.String(42), nullable=True)
    tx_hash = db.Column(db.String(66), nullable=True)
    token_id = db.Column(db.String(20), nullable=True)
    bet_id = db.Column(db.Integer, nullable=True)
    reference_id = db.Column(db.Integer, nullable=True)