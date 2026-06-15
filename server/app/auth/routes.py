from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

from app.models.user import User
from app.models.wallet import Wallet
from app.auth.services import register_user
from app.extensions import bcrypt, db

auth_bp = Blueprint("auth", __name__)


# REGISTER
@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")  # 'admin' or 'user'

    if role not in ["admin", "user"]:
        role = "user"

    user, error = register_user(
        username,
        email,
        password,
        role
    )

    if error:
        return {"error": error}, 400

    access_token = create_access_token(identity=str(user.id))

    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }, 201


# LOGIN
@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if not user:
        return {"error": "Invalid credentials"}, 401

    valid_password = bcrypt.check_password_hash(
        user.password,
        password
    )

    if not valid_password:
        return {"error": "Invalid credentials"}, 401

    access_token = create_access_token(identity=str(user.id))

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }



# GET CURRENT USER
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():

    current_user_id = get_jwt_identity()

    user = User.query.get(current_user_id)

    wallet = Wallet.query.filter_by(user_id=user.id).first()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "wallet_address": user.wallet_address,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "wallet_balance": wallet.balance if wallet else 0
    }


# GET PROFILE
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return {"error": "User not found"}, 404

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "wallet_address": user.wallet_address,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# UPDATE PROFILE
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return {"error": "User not found"}, 404

    data = request.get_json() or {}

    username = data.get("username")
    email = data.get("email")
    phone = data.get("phone")
    bio = data.get("bio")
    avatar_url = data.get("avatar_url")
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if username:
        if len(username) < 2 or len(username) > 50:
            return {"error": "Username must be between 2 and 50 characters"}, 400
        user.username = username

    if email:
        existing = User.query.filter(User.email == email, User.id != user.id).first()
        if existing:
            return {"error": "Email already in use"}, 400
        user.email = email

    if phone is not None:
        if len(phone) > 20:
            return {"error": "Phone number too long"}, 400
        user.phone = phone

    if bio is not None:
        if len(bio) > 300:
            return {"error": "Bio must be under 300 characters"}, 400
        user.bio = bio

    if avatar_url is not None:
        if len(avatar_url) > 2_000_000:
            return {"error": "Image too large"}, 400
        user.avatar_url = avatar_url

    if new_password:
        if not current_password:
            return {"error": "Current password is required to set a new password"}, 400
        if not bcrypt.check_password_hash(user.password, current_password):
            return {"error": "Current password is incorrect"}, 400
        if len(new_password) < 6:
            return {"error": "New password must be at least 6 characters"}, 400
        user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")

    db.session.commit()

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "wallet_address": user.wallet_address,
        }
    }