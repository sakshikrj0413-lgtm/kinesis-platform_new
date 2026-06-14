from app.models.user import User
from app.models.transaction import Transaction
from app.extensions import db
from app.config import Config


def connect_wallet(user_id, wallet_address, chain_id):
    user = User.query.get(user_id)
    if not user:
        return None, "User not found"

    existing_user = User.query.filter(
        User.wallet_address == wallet_address,
        User.id != user_id
    ).first()
    if existing_user:
        return None, "Wallet address already connected to another user"

    user.wallet_address = wallet_address
    user.chain_id = chain_id

    db.session.commit()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "wallet_address": user.wallet_address,
        "chain_id": user.chain_id,
    }, None


def get_wallet_info(user_id):
    user = User.query.get(user_id)
    if not user:
        return None, "User not found"

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "wallet_address": user.wallet_address,
        "chain_id": user.chain_id,
    }, None


def initiate_transfer(user_id, from_address, amount, tx_hash=None, bet_id=None, market_id=None, outcome_id=None):
    user = User.query.get(user_id)
    if not user:
        return None, "User not found"

    if not from_address or not from_address.startswith("0x") or len(from_address) != 42:
        return None, "Invalid from wallet address"

    if user.wallet_address and user.wallet_address.lower() != from_address.lower():
        return None, "Wallet address does not match connected wallet"

    market_title = None
    outcome_title = None
    betting_price = 0.001  # Default betting price
    if market_id:
        from app.models.market import Market
        from app.models.market_outcome import MarketOutcome
        market = Market.query.get(market_id)
        if market:
            market_title = market.title
        if outcome_id:
            outcome = MarketOutcome.query.get(outcome_id)
            if outcome:
                outcome_title = outcome.title
                betting_price = outcome.betting_price or 0.001

    # Total amount includes both the betting price and the transferred amount
    total_amount = float(amount) + betting_price

    transaction = Transaction(
        wallet_id=None,
        type="NFT_TRANSFER",
        amount=float(amount),
        status="completed" if tx_hash else "pending",
        from_wallet_address=from_address,
        to_wallet_address=Config.ADMIN_WALLET_ADDRESS,
        tx_hash=tx_hash,
        bet_id=bet_id
    )
    db.session.add(transaction)
    db.session.commit()

    return {
        "id": transaction.id,
        "from_wallet": from_address,
        "to_wallet": Config.ADMIN_WALLET_ADDRESS,
        "amount": amount,
        "betting_price": betting_price,
        "total_amount": total_amount,
        "tx_hash": tx_hash,
        "status": transaction.status,
        "market_title": market_title,
        "outcome_title": outcome_title,
        "created_at": transaction.created_at.isoformat()
    }, None