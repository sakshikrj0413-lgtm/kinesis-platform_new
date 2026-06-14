from flask_socketio import emit


def emit_odds_update(data, socketio):
    socketio.emit("odds_update", data)


def emit_market_update(data, socketio):
    socketio.emit("market_update", data)


def emit_bet_matched(data, socketio):
    socketio.emit("bet_matched", data)


def emit_orderbook_update(data, socketio):
    socketio.emit("orderbook_update", data)


def emit_live_activity(data, socketio):
    socketio.emit("live_activity", data)


def emit_wallet_updated(data, socketio):
    socketio.emit("wallet_updated", data)


def emit_wallet_updated_user(user_id, data, socketio):
    """Emit wallet update to a specific user's room."""
    socketio.emit("wallet_updated", data, room=f"user_{user_id}")


def emit_bet_settled(user_id, data, socketio):
    """
    Emit bet settlement result to the specific user whose bet settled.
    Payload: { bet_id, market_id, market_title, outcome_title, side,
               status (WON|LOST), payout, profit, timestamp }
    """
    socketio.emit("bet_settled", data, room=f"user_{user_id}")


def emit_transaction_added(user_id, data, socketio):
    """
    Emit new transaction to user so Wallet tab appends it in real time.
    Payload: { id, type, amount, status, created_at }
    """
    socketio.emit("transaction_added", data, room=f"user_{user_id}")


def emit_market_resolved(data, socketio):
    """Broadcast to all clients that a market has been resolved."""
    socketio.emit("market_resolved", data)


def emit_admin_transaction_notification(user_id, data, socketio):
    """Emit transaction notification to specific admin user"""
    socketio.emit("admin_transaction", data, room=f"user_{user_id}")


def emit_agent_started(data, socketio):
    socketio.emit("agent_started", data)


def emit_agent_stopped(data, socketio):
    socketio.emit("agent_stopped", data)


def emit_agent_bet(data, socketio):
    socketio.emit("agent_bet", data)


def emit_agent_alert(data, socketio):
    socketio.emit("agent_alert", data)


def emit_agent_profit_update(data, socketio):
    socketio.emit("agent_profit_update", data)
