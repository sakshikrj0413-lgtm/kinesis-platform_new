import random
import math
from datetime import datetime, timedelta


def calculate_implied_probability(decimal_odds):
    if decimal_odds <= 0:
        return 1.0
    return 1.0 / decimal_odds


def calculate_edge(true_probability, market_probability):
    return round((true_probability - market_probability) * 100, 2)


def estimate_true_probability(market_odds, volume_score=50, momentum=0, historical_accuracy=0.55):
    implied_prob = calculate_implied_probability(market_odds)

    market_bias = (random.random() - 0.5) * 0.08
    volume_adjustment = (volume_score - 50) / 500
    momentum_adjustment = momentum * 0.02

    true_prob = implied_prob + market_bias + volume_adjustment + momentum_adjustment
    true_prob = max(0.05, min(0.95, true_prob))

    return round(true_prob, 4)


def calculate_volume_score(total_bets, total_stake, time_window_minutes=60):
    bet_score = min(total_bets / 20, 1.0) * 40
    stake_score = min(total_stake / 5000, 1.0) * 40
    velocity_score = min((total_bets / max(time_window_minutes, 1)) / 2, 1.0) * 20
    return round(bet_score + stake_score + velocity_score, 2)


def calculate_odds_momentum(current_odds, previous_odds):
    if previous_odds == 0:
        return 0
    return round((current_odds - previous_odds) / previous_odds, 4)
