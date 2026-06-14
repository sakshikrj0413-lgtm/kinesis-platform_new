from flask import Blueprint

arb_bp = Blueprint("arbitrage", __name__)

from app.arbitrage import routes
