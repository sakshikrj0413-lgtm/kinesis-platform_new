import os
import json
import logging
from openai import OpenAI

from app.ai.prompts import (
    SYSTEM_PROMPT,
    MARKET_ANALYSIS_PROMPT,
    SUGGESTED_BETS_PROMPT,
    TRENDING_PROMPT,
)

logger = logging.getLogger(__name__)

client = None


def get_openai_client():
    global client
    if client is None:
        api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("GROQ_API_KEY not set, AI features will use mock responses")
            return None
        base_url = "https://api.groq.com/openai/v1" if os.environ.get("GROQ_API_KEY") else None
        client = OpenAI(api_key=api_key, base_url=base_url)
    return client


def generate_ai_response(messages, max_tokens=1024, temperature=0.7):
    """
    Generate AI response using OpenAI.
    messages: list of {role, content} dicts
    Returns: str response text
    """
    openai = get_openai_client()
    if openai is None:
        return _mock_ai_response(messages)

    try:
        system_message = {"role": "system", "content": SYSTEM_PROMPT}
        full_messages = [system_message] + messages

        model = "llama-3.3-70b-versatile" if os.environ.get("GROQ_API_KEY") else "gpt-4o-mini"

        response = openai.chat.completions.create(
            model=model,
            messages=full_messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return _mock_ai_response(messages)


def analyze_market_with_ai(market_context, max_tokens=1024):
    """
    Analyze a specific market using AI.
    market_context: formatted string with market data
    Returns: str analysis
    """
    openai = get_openai_client()
    if openai is None:
        return _mock_market_analysis(market_context)

    try:
        prompt = MARKET_ANALYSIS_PROMPT.format(market_context=market_context)

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.5,
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"OpenAI market analysis error: {e}")
        return _mock_market_analysis(market_context)


def generate_suggested_bets(market_data):
    """
    Generate suggested bets based on market data.
    Returns: list of bet suggestions
    """
    openai = get_openai_client()
    if openai is None:
        return _mock_suggested_bets(market_data)

    try:
        prompt = SUGGESTED_BETS_PROMPT.format(market_data=market_data)

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return ONLY a valid JSON array. No markdown, no explanation."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=512,
            temperature=0.6,
        )

        content = response.choices[0].message.content.strip()
        content = content.replace("```json", "").replace("```", "").strip()

        return json.loads(content)

    except Exception as e:
        logger.error(f"OpenAI suggested bets error: {e}")
        return _mock_suggested_bets(market_data)


def generate_trending_analysis(markets_data):
    """
    Generate trending market analysis.
    Returns: str analysis
    """
    openai = get_openai_client()
    if openai is None:
        return _mock_trending_analysis(markets_data)

    try:
        prompt = TRENDING_PROMPT.format(markets_data=markets_data)

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=768,
            temperature=0.6,
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"OpenAI trending analysis error: {e}")
        return _mock_trending_analysis(markets_data)


def _mock_ai_response(messages):
    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    return (
        f"AGENTEX AI Analysis:\n\n"
        f"Regarding your query about \"{last_user[:80]}...\":\n\n"
        f"Based on current market conditions and odds analysis:\n\n"
        f"**Market Sentiment:** Moderate bullish activity detected\n"
        f"**Implied Probability:** 42-58% range across outcomes\n"
        f"**Liquidity:** Adequate for standard positions\n\n"
        f"**Recommendation:** Consider medium-risk positions with 3-5% bankroll allocation. "
        f"Monitor odds movement for value entry points.\n\n"
        f"*Note: Connect OPENAI_API_KEY for full AI analysis capabilities.*"
    )


def _mock_market_analysis(context):
    return (
        f"AGENTEX Market Analysis:\n\n"
        f"**Market Overview:** Active market with moderate liquidity\n\n"
        f"**Odds Analysis:**\n"
        f"- Current odds suggest a balanced market\n"
        f"- Implied probabilities range from 35-65%\n"
        f"- Minor value detected on underdog outcomes\n\n"
        f"**Value Assessment:**\n"
        f"- Estimated Edge: 4.2%\n"
        f"- Confidence: 68/100\n\n"
        f"**Risk Level:** MEDIUM\n\n"
        f"**Recommendation:** Consider a small BACK position on the value outcome. "
        f"Kelly Criterion suggests 2-4% of bankroll.\n\n"
        f"*Note: Connect OPENAI_API_KEY for full AI analysis capabilities.*"
    )


def _mock_suggested_bets(data):
    return [
        {
            "market": "Conservative Pick",
            "side": "BACK",
            "confidence": 75,
            "risk": "LOW",
            "edge": 3.2,
            "reasoning": "High probability outcome with stable odds and good liquidity"
        },
        {
            "market": "Balanced Value",
            "side": "BACK",
            "confidence": 62,
            "risk": "MEDIUM",
            "edge": 6.5,
            "reasoning": "Moderate edge with acceptable risk-reward ratio"
        },
        {
            "market": "High Edge Play",
            "side": "LAY",
            "confidence": 45,
            "risk": "HIGH",
            "edge": 12.1,
            "reasoning": "Significant edge detected but higher volatility expected"
        }
    ]


def _mock_trending_analysis(data):
    return (
        f"AGENTEX Trending Analysis:\n\n"
        f"**Top Trending Markets:**\n\n"
        f"1. **High Volume Market** - Significant betting activity with 72% confidence\n"
        f"   Risk: MEDIUM | Edge: ~5%\n\n"
        f"2. **Emerging Opportunity** - Growing liquidity, sharp money detected\n"
        f"   Risk: LOW | Edge: ~3.5%\n\n"
        f"3. **Contrarian Play** - Market overreaction creating value\n"
        f"   Risk: HIGH | Edge: ~9%\n\n"
        f"*Note: Connect OPENAI_API_KEY for full AI analysis capabilities.*"
    )
