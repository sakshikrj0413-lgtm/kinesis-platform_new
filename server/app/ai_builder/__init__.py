from flask import Blueprint

ai_builder_bp = Blueprint("ai_builder", __name__)

from app.ai_builder import routes
