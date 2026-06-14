"""
SocketIO connection handlers.
Clients call `socket.emit('join_user_room', { token })` after connecting
so the server can place them in their personal room (user_<id>).
Per-user events (bet_settled, wallet_updated, transaction_added) are then
routed only to that room instead of broadcasting to everyone.
"""
from flask_socketio import join_room, leave_room  # type: ignore[import]
from flask_jwt_extended import decode_token  # type: ignore[import]
from app.extensions import socketio


@socketio.on("connect")
def on_connect():
    pass  # connection logs handled by Flask-SocketIO internals


@socketio.on("join_user_room")
def on_join_user_room(data):
    """
    Client sends: { token: '<JWT>' }
    Server puts the socket in room 'user_<id>'.
    """
    try:
        token = data.get("token", "")
        decoded = decode_token(token)
        user_id = decoded.get("sub")
        if user_id:
            join_room(f"user_{user_id}")
    except Exception:
        pass  # invalid / expired token — just don't join the room


@socketio.on("leave_user_room")
def on_leave_user_room(data):
    try:
        token = data.get("token", "")
        decoded = decode_token(token)
        user_id = decoded.get("sub")
        if user_id:
            leave_room(f"user_{user_id}")
    except Exception:
        pass


@socketio.on("disconnect")
def on_disconnect():
    pass
