from app.models.user import User
from app.models.wallet import Wallet
from app.extensions import db, bcrypt

def register_user(username, email, password, role="user"):

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return None, "User already exists"

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(
        username=username,
        email=email,
        password=hashed_password,
        role=role
    )

    db.session.add(user)
    db.session.flush()

    wallet = Wallet(
        user_id=user.id,
        balance=1000 if role == "user" else 0  # Admins don't need initial balance
    )

    db.session.add(wallet)
    db.session.commit()

    return user, None