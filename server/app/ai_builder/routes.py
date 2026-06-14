from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.ai_builder import ai_builder_bp
from app.ai_builder.compiler import compiler
from app.middleware.auth_middleware import user_required


@ai_builder_bp.route("/generate-market", methods=["POST"])
@jwt_required()
@user_required
def generate_market():
    data = request.get_json()
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    result, error = compiler.compile(prompt, "market")
    if error:
        return jsonify({"error": error}), 500

    errors = compiler.validate(result, "market")
    if errors:
        return jsonify({"result": result, "validation_errors": errors, "valid": False})

    return jsonify({"result": result, "validation_errors": [], "valid": True})


@ai_builder_bp.route("/generate-agent", methods=["POST"])
@jwt_required()
@user_required
def generate_agent():
    data = request.get_json()
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    result, error = compiler.compile(prompt, "agent")
    if error:
        return jsonify({"error": error}), 500

    errors = compiler.validate(result, "agent")
    if errors:
        return jsonify({"result": result, "validation_errors": errors, "valid": False})

    return jsonify({"result": result, "validation_errors": [], "valid": True})


@ai_builder_bp.route("/generate-contract", methods=["POST"])
@jwt_required()
@user_required
def generate_contract():
    data = request.get_json()
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    result, error = compiler.compile(prompt, "contract")
    if error:
        return jsonify({"error": error}), 500

    errors = compiler.validate(result, "contract")
    if errors:
        return jsonify({"result": result, "validation_errors": errors, "valid": False})

    return jsonify({"result": result, "validation_errors": [], "valid": True})


@ai_builder_bp.route("/generate-casino", methods=["POST"])
@jwt_required()
@user_required
def generate_casino():
    data = request.get_json()
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    result, error = compiler.compile(prompt, "casino")
    if error:
        return jsonify({"error": error}), 500

    errors = compiler.validate(result, "casino")
    if errors:
        return jsonify({"result": result, "validation_errors": errors, "valid": False})

    return jsonify({"result": result, "validation_errors": [], "valid": True})


@ai_builder_bp.route("/validate", methods=["POST"])
@jwt_required()
@user_required
def validate():
    data = request.get_json()
    type_name = data.get("type", "")
    payload = data.get("data", {})

    if not type_name:
        return jsonify({"error": "Type is required"}), 400

    errors = compiler.validate(payload, type_name)
    return jsonify({"valid": len(errors) == 0, "errors": errors})
