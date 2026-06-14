import json
import os
from app.ai_builder.prompts import MARKET_GENERATOR, AGENT_GENERATOR, CONTRACT_GENERATOR, CASINO_GENERATOR
from app.ai_builder.validators import VALIDATORS


class AICompiler:
    def __init__(self):
        self._openai_client = None

    def _get_client(self):
        if self._openai_client is None:
            api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
            if api_key:
                try:
                    from openai import OpenAI
                    base_url = "https://api.groq.com/openai/v1" if os.environ.get("GROQ_API_KEY") else None
                    self._openai_client = OpenAI(api_key=api_key, base_url=base_url)
                except Exception:
                    self._openai_client = None
        return self._openai_client

    def compile(self, prompt, type_name):
        prompts = {
            "market": MARKET_GENERATOR,
            "agent": AGENT_GENERATOR,
            "contract": CONTRACT_GENERATOR,
            "casino": CASINO_GENERATOR,
        }

        template = prompts.get(type_name)
        if not template:
            return None, f"Unknown type: {type_name}"

        try:
            formatted = template.format(prompt=prompt)
        except Exception:
            formatted = template.replace("{prompt}", prompt)

        client = self._get_client()
        if client:
            try:
                model = "llama-3.3-70b-versatile" if os.environ.get("GROQ_API_KEY") else "gpt-4o-mini"

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": formatted}],
                    temperature=0.3,
                    max_tokens=500,
                )
                content = response.choices[0].message.content.strip()
                content = content.strip("```json").strip("```").strip()
                result = json.loads(content)
                return result, None
            except Exception:
                pass

        return self._fallback_compile(prompt, type_name), None

    def _fallback_compile(self, prompt, type_name):
        p = prompt.lower()

        if type_name == "market":
            if "ipl" in p or "cricket" in p:
                return {
                    "title": "IPL Finals Winner",
                    "description": "Who will win the IPL Finals?",
                    "type": "BINARY",
                    "outcomes": [
                        {"title": "Mumbai Indians", "initial_odds": 0.52},
                        {"title": "Chennai Super Kings", "initial_odds": 0.48},
                    ],
                }
            elif "football" in p or "arsenal" in p or "chelsea" in p:
                return {
                    "title": "Arsenal vs Chelsea - Match Winner",
                    "description": "Who will win the Premier League match?",
                    "type": "BINARY",
                    "outcomes": [
                        {"title": "Arsenal Win", "initial_odds": 0.55},
                        {"title": "Chelsea Win", "initial_odds": 0.45},
                    ],
                }
            elif "election" in p or "politics" in p:
                return {
                    "title": "2026 Election Outcome",
                    "description": "Will the incumbent party win?",
                    "type": "BINARY",
                    "outcomes": [
                        {"title": "Yes", "initial_odds": 0.48},
                        {"title": "No", "initial_odds": 0.52},
                    ],
                }
            else:
                return {
                    "title": prompt[:50] if len(prompt) > 50 else prompt,
                    "description": f"Market generated from: {prompt}",
                    "type": "BINARY",
                    "outcomes": [
                        {"title": "Yes", "initial_odds": 0.53},
                        {"title": "No", "initial_odds": 0.47},
                    ],
                }

        elif type_name == "agent":
            if "low risk" in p or "conservative" in p or "safe" in p:
                return {
                    "name": "Conservative Hunter",
                    "sport": "all",
                    "strategy": "conservative",
                    "min_edge": 5,
                    "max_stake": 25,
                    "daily_loss_limit": 100,
                    "rules": {
                        "max_odds": 0.80,
                        "min_odds": 0.10,
                        "cooldown_seconds": 120,
                        "stop_loss": 50,
                        "allowed_market_types": "BINARY",
                    },
                }
            elif "football" in p:
                return {
                    "name": "Football Edge Scanner",
                    "sport": "football",
                    "strategy": "edge_hunter",
                    "min_edge": 4,
                    "max_stake": 50,
                    "daily_loss_limit": 200,
                    "rules": {
                        "max_odds": 0.95,
                        "min_odds": 0.05,
                        "cooldown_seconds": 60,
                        "stop_loss": 100,
                        "allowed_market_types": "BINARY,MULTI",
                    },
                }
            elif "aggressive" in p or "high risk" in p:
                return {
                    "name": "Aggressive Momentum Bot",
                    "sport": "all",
                    "strategy": "aggressive",
                    "min_edge": 2,
                    "max_stake": 100,
                    "daily_loss_limit": 500,
                    "rules": {
                        "max_odds": 0.99,
                        "min_odds": 0.01,
                        "cooldown_seconds": 30,
                        "stop_loss": 200,
                        "allowed_market_types": "BINARY,MULTI",
                    },
                }
            else:
                return {
                    "name": "AI Edge Hunter",
                    "sport": "all",
                    "strategy": "edge_hunter",
                    "min_edge": 3,
                    "max_stake": 50,
                    "daily_loss_limit": 200,
                    "rules": {
                        "max_odds": 0.95,
                        "min_odds": 0.05,
                        "cooldown_seconds": 60,
                        "stop_loss": 100,
                        "allowed_market_types": "BINARY,MULTI",
                    },
                }

        elif type_name == "contract":
            return {
                "name": prompt[:50] if len(prompt) > 50 else prompt,
                "description": f"Contract generated from: {prompt}",
                "rules": [
                    {"condition": "Market resolves to outcome A", "action": "Pay BACK bettors", "priority": 1},
                    {"condition": "Market resolves to outcome B", "action": "Pay BACK bettors on B", "priority": 2},
                    {"condition": "Market cancelled", "action": "Refund all stakes", "priority": 3},
                ],
                "payout_structure": "Standard prediction market settlement",
                "settlement_type": "automatic",
            }

        elif type_name == "casino":
            return {
                "name": prompt[:50] if len(prompt) > 50 else prompt,
                "type": "table_game",
                "house_edge": 0.05,
                "rules": ["Standard casino rules apply", "House always resolves fairly"],
                "min_bet": 1,
                "max_bet": 1000,
                "payout_table": {"win": "2x", "jackpot": "10x"},
            }

        return {}

    def validate(self, data, type_name):
        validator = VALIDATORS.get(type_name)
        if not validator:
            return [f"No validator for type: {type_name}"]
        return validator(data)


compiler = AICompiler()
