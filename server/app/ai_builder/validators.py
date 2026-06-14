def validate_market_schema(data):
    errors = []
    required = ["title", "type", "outcomes"]
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    if data.get("type") not in ("BINARY", "MULTI"):
        errors.append("type must be BINARY or MULTI")

    outcomes = data.get("outcomes", [])
    if not isinstance(outcomes, list) or len(outcomes) < 2:
        errors.append("outcomes must be a list with at least 2 items")

    for i, outcome in enumerate(outcomes):
        if "title" not in outcome:
            errors.append(f"outcome[{i}] missing title")
        if "initial_odds" not in outcome:
            errors.append(f"outcome[{i}] missing initial_odds")
        elif not (0.01 <= outcome.get("initial_odds", 0) <= 0.99):
            errors.append(f"outcome[{i}] initial_odds must be between 0.01 and 0.99")

    return errors


def validate_agent_schema(data):
    errors = []
    required = ["name", "sport", "strategy", "min_edge", "max_stake", "daily_loss_limit"]
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    valid_sports = ["all", "football", "basketball", "tennis", "cricket"]
    if data.get("sport") not in valid_sports:
        errors.append(f"sport must be one of: {', '.join(valid_sports)}")

    valid_strategies = ["edge_hunter", "momentum", "conservative", "aggressive"]
    if data.get("strategy") not in valid_strategies:
        errors.append(f"strategy must be one of: {', '.join(valid_strategies)}")

    if not (1 <= data.get("min_edge", 0) <= 20):
        errors.append("min_edge must be between 1 and 20")

    if not (10 <= data.get("max_stake", 0) <= 500):
        errors.append("max_stake must be between 10 and 500")

    if not (50 <= data.get("daily_loss_limit", 0) <= 1000):
        errors.append("daily_loss_limit must be between 50 and 1000")

    return errors


def validate_contract_schema(data):
    errors = []
    required = ["name", "rules"]
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    rules = data.get("rules", [])
    if not isinstance(rules, list) or len(rules) == 0:
        errors.append("rules must be a non-empty list")

    return errors


def validate_casino_schema(data):
    errors = []
    required = ["name", "type", "house_edge", "rules"]
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    if not (0 <= data.get("house_edge", -1) <= 0.2):
        errors.append("house_edge must be between 0 and 0.2")

    return errors


VALIDATORS = {
    "market": validate_market_schema,
    "agent": validate_agent_schema,
    "contract": validate_contract_schema,
    "casino": validate_casino_schema,
}
