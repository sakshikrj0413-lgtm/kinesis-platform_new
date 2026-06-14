from app.extensions import db
from datetime import datetime


class AIMessage(db.Model):

    __tablename__ = "ai_messages"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    chat_id = db.Column(
        db.Integer,
        db.ForeignKey("ai_chats.id"),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False
    )

    content = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "chat_id": self.chat_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat()
        }
