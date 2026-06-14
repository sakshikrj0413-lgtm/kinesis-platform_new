from app.extensions import db

class Wallet(db.Model):
    __tablename__ = "wallets"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    balance = db.Column(db.Float, default=1000)

    currency = db.Column(db.String(10), default="GU")