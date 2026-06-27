from app.extensions import db
from datetime import datetime
import json

class AuroraConfig(db.Model):
    __tablename__ = "aurora_configs"

    id = db.Column(db.Integer, primary_key=True)
    rehypothecation_depth_limit = db.Column(db.Integer, default=3)
    circuit_breaker_active = db.Column(db.Boolean, default=False)
    isolation_zones = db.Column(db.Text, default="[]")  # JSON list of zones

    def to_dict(self):
        try:
            zones = json.loads(self.isolation_zones)
        except Exception:
            zones = []
        return {
            "id": self.id,
            "rehypothecation_depth_limit": self.rehypothecation_depth_limit,
            "circuit_breaker_active": self.circuit_breaker_active,
            "isolation_zones": zones
        }

class AuroraAsset(db.Model):
    __tablename__ = "aurora_assets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    asset_name = db.Column(db.String(100), nullable=False)
    asset_type = db.Column(db.String(50), nullable=False)  # "T-bill", "Repo Contract", "Bank Deposit", "Stablecoin"
    face_value = db.Column(db.Float, nullable=False)
    valuation = db.Column(db.Float, nullable=False)
    haircut = db.Column(db.Float, default=0.05)
    eligibility_score = db.Column(db.Float, default=0.9)
    status = db.Column(db.String(20), default="active")  # "active", "pledged", "released"
    rehypothecation_chain = db.Column(db.Text, default="[]")  # JSON list of nodes
    is_zk_encrypted = db.Column(db.Boolean, default=False)
    encrypted_hash = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        try:
            chain = json.loads(self.rehypothecation_chain)
        except Exception:
            chain = []
        return {
            "id": self.id,
            "user_id": self.user_id,
            "asset_name": self.asset_name,
            "asset_type": self.asset_type,
            "face_value": self.face_value,
            "valuation": self.valuation,
            "haircut": self.haircut,
            "eligibility_score": self.eligibility_score,
            "status": self.status,
            "rehypothecation_chain": chain,
            "is_zk_encrypted": self.is_zk_encrypted,
            "encrypted_hash": self.encrypted_hash,
            "created_at": self.created_at.isoformat()
        }

class IntradayOrder(db.Model):
    __tablename__ = "aurora_intraday_orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # "bid" (borrower) or "ask" (lender)
    amount = db.Column(db.Float, nullable=False)
    rate = db.Column(db.Float, nullable=False)  # e.g., 0.0525 (5.25%)
    duration_minutes = db.Column(db.Integer, default=120)  # e.g. 15, 120, 240, 1440
    status = db.Column(db.String(20), default="pending")  # "pending", "matched", "cancelled"
    matched_order_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "amount": self.amount,
            "rate": self.rate,
            "duration_minutes": self.duration_minutes,
            "status": self.status,
            "matched_order_id": self.matched_order_id,
            "created_at": self.created_at.isoformat()
        }

class Obligation(db.Model):
    __tablename__ = "aurora_obligations"

    id = db.Column(db.Integer, primary_key=True)
    debtor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    creditor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default="USD")
    status = db.Column(db.String(20), default="pending")  # "pending", "netted", "settled"
    netted_against_id = db.Column(db.Integer, nullable=True)
    scheduled_time = db.Column(db.DateTime, default=datetime.utcnow)
    is_rescheduled = db.Column(db.Boolean, default=False)
    original_time = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "debtor_id": self.debtor_id,
            "creditor_id": self.creditor_id,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "netted_against_id": self.netted_against_id,
            "scheduled_time": self.scheduled_time.isoformat(),
            "is_rescheduled": self.is_rescheduled,
            "original_time": self.original_time.isoformat() if self.original_time else None
        }

class AcaCertificate(db.Model):
    __tablename__ = "aurora_aca_certificates"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    cryptographic_identity = db.Column(db.String(100), unique=True, nullable=False)
    budget = db.Column(db.Float, default=1000000.0)
    risk_profile = db.Column(db.String(50), default="Conservative")
    permitted_counterparties = db.Column(db.Text, default="[]")  # JSON list
    model_fingerprint = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default="active")  # "active", "suspended", "warning"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        try:
            cps = json.loads(self.permitted_counterparties)
        except Exception:
            cps = []
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "cryptographic_identity": self.cryptographic_identity,
            "budget": self.budget,
            "risk_profile": self.risk_profile,
            "permitted_counterparties": cps,
            "model_fingerprint": self.model_fingerprint,
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }

class AthenaLog(db.Model):
    __tablename__ = "aurora_athena_logs"

    id = db.Column(db.Integer, primary_key=True)
    certificate_id = db.Column(db.Integer, db.ForeignKey("aurora_aca_certificates.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default="INFO")  # "INFO", "WARNING", "ALERT"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "certificate_id": self.certificate_id,
            "message": self.message,
            "severity": self.severity,
            "created_at": self.created_at.isoformat()
        }
