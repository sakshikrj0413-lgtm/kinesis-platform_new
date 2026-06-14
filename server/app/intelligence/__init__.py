from flask import Blueprint

intelligence_bp = Blueprint("intelligence", __name__)

from app.intelligence import routes
