from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.wallet.services import connect_wallet, get_wallet_info, initiate_transfer
from app.models.market import Market
from app.socket.events import emit_admin_transaction_notification
from app.extensions import socketio,db
from app.models.wallet import Wallet
import razorpay
import os

razorpay_client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))
wallet_bp = Blueprint("wallet", __name__)

@wallet_bp.route("/create-order", methods=["POST"])
@jwt_required()
def create_order():
    data = request.get_json()
    amount = data.get("amount")

    if not amount or amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    order = razorpay_client.order.create({
        "amount": int(amount) * 100,
        "currency": "INR",
        "payment_capture": 1
    })

    return jsonify({
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": os.getenv("RAZORPAY_KEY_ID")
    }), 200


@wallet_bp.route("/verify-payment", methods=["POST"])
@jwt_required()
def verify_payment():
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data["razorpay_order_id"],
            "razorpay_payment_id": data["razorpay_payment_id"],
            "razorpay_signature": data["razorpay_signature"]
        })
    except Exception:
        return jsonify({"error": "Payment verification failed"}), 400

    amount = data.get("amount")
    wallet = Wallet.query.filter_by(user_id=user_id).first()
    if not wallet:
        return jsonify({"error": "Wallet not found"}), 404

    wallet.balance += amount
    db.session.commit()

    return jsonify({
        "message": "Payment verified and balance updated",
        "new_balance": wallet.balance
    }), 200

@wallet_bp.route("/connect", methods=["POST"])
@jwt_required()
def connect():
    user_id = get_jwt_identity()
    data = request.get_json()

    print(f"[DEBUG] Wallet connect request - user_id: {user_id}")
    print(f"[DEBUG] Request JSON: {data}")

    wallet_address = data.get("wallet_address") if data else None
    chain_id = data.get("chain_id") if data else None

    print(f"[DEBUG] wallet_address: {wallet_address}")
    print(f"[DEBUG] chain_id: {chain_id}")

    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    if not wallet_address.startswith("0x") or len(wallet_address) != 42:
        return jsonify({"error": "Invalid wallet address format"}), 400

    user, error = connect_wallet(user_id, wallet_address, chain_id)

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Wallet connected successfully",
        "user": user
    }), 200


@wallet_bp.route("/me", methods=["GET"])
@jwt_required()
def get_wallet():
    user_id = get_jwt_identity()

    user, error = get_wallet_info(user_id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify({"user": user}), 200


@wallet_bp.route("/transfer", methods=["POST"])
@jwt_required()
def transfer():
    user_id = get_jwt_identity()
    data = request.get_json()

    from_address = data.get("from_address")
    amount = data.get("amount")
    tx_hash = data.get("tx_hash")
    bet_id = data.get("bet_id")
    market_id = data.get("market_id")
    outcome_id = data.get("outcome_id")

    if not from_address:
        return jsonify({"error": "From wallet address is required"}), 400

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Valid amount is required"}), 400

    transaction, error = initiate_transfer(
        user_id=user_id,
        from_address=from_address,
        amount=amount,
        tx_hash=tx_hash,
        bet_id=bet_id,
        market_id=market_id,
        outcome_id=outcome_id
    )

    if error:
        return jsonify({"error": error}), 400

    # Emit notification to admin (market creator)
    if market_id:
        market = Market.query.get(market_id)
        if market and market.created_by:
            from app.models.user import User
            admin_user = User.query.get(market.created_by)
            if admin_user:
                notification_data = {
                    "transaction_id": transaction["id"],
                    "user_wallet": from_address,
                    "amount": amount,
                    "market_title": transaction["market_title"],
                    "outcome_title": transaction["outcome_title"],
                    "status": transaction["status"],
                    "created_at": transaction["created_at"]
                }
                emit_admin_transaction_notification(admin_user.id, notification_data, socketio)

    return jsonify({
        "message": "Transfer recorded successfully",
        "transaction": transaction
    }), 201