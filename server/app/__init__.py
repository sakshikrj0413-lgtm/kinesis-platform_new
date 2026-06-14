from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db, jwt, bcrypt, migrate, socketio
from app.markets.routes import market_bp
from app.bets.routes import bet_bp

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": [
        "https://kinesis-platform-1.onrender.com",
        "http://localhost:5173",
    ]}}, supports_credentials=True)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app)

    # Register socket event handlers (user room join/leave)
    from app.socket import handlers as _socket_handlers  # noqa: F401

    from app.models import User, Wallet, Transaction, Bet

    from app.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    app.register_blueprint(market_bp, url_prefix="/api/markets")

    app.register_blueprint(bet_bp, url_prefix="/api/bets")

    from app.admin.routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    from app.wallet.routes import wallet_bp
    app.register_blueprint(wallet_bp, url_prefix="/api/wallet")

    from app.portfolio.routes import portfolio_bp
    app.register_blueprint(portfolio_bp, url_prefix="/api/portfolio")

    from app.ai.routes import ai_bp
    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    from app.intelligence import intelligence_bp
    app.register_blueprint(intelligence_bp, url_prefix="/api/intelligence")

    from app.agents import agents_bp
    app.register_blueprint(agents_bp, url_prefix="/api/agents")

    from app.arbitrage import arb_bp
    app.register_blueprint(arb_bp, url_prefix="/api/arb")

    from app.ai_builder import ai_builder_bp
    app.register_blueprint(ai_builder_bp, url_prefix="/api/ai-builder")

    from app.marketplace import marketplace_bp
    app.register_blueprint(marketplace_bp, url_prefix="/api/marketplace")

    from app.agents.scheduler import scheduler
    scheduler.start(socketio)

    from app.arbitrage.scheduler import scheduler as arb_scheduler
    arb_scheduler.start(socketio)

    # Auto-seed real sports markets from The Odds API
    from app.markets.odds_seeder import odds_seeder
    odds_seeder.init_app(app)
    odds_seeder.start()

    return app