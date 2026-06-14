from app.models.marketplace import MarketplaceAgent, MarketplaceRating
from app.models.agent import Agent


def publish_agent(agent_id, user_id, title, description, public=True):
    agent = Agent.query.filter_by(id=agent_id, user_id=user_id).first()
    if not agent:
        return None, "Agent not found"

    existing = MarketplaceAgent.query.filter_by(agent_id=agent_id).first()
    if existing:
        existing.title = title
        existing.description = description
        existing.public = public
        existing.roi = agent.roi
        existing.win_rate = agent.win_rate
        existing.strategy_type = agent.strategy
        existing.sport = agent.sport
        return existing, None

    listing = MarketplaceAgent(
        agent_id=agent_id,
        creator_id=user_id,
        title=title,
        description=description,
        public=public,
        roi=agent.roi,
        win_rate=agent.win_rate,
        strategy_type=agent.strategy,
        sport=agent.sport,
    )

    from app.extensions import db
    db.session.add(listing)
    db.session.commit()

    return listing, None


def clone_agent(marketplace_agent_id, user_id):
    listing = MarketplaceAgent.query.get(marketplace_agent_id)
    if not listing:
        return None, "Listing not found"

    from app.extensions import db
    from app.models.agent import AgentRule, AgentLog
    import datetime

    source_agent = Agent.query.get(listing.agent_id)
    if not source_agent:
        return None, "Source agent not found"

    new_agent = Agent(
        user_id=user_id,
        name=f"{listing.title} (Clone)",
        sport=listing.sport,
        strategy=listing.strategy_type,
        min_edge=source_agent.min_edge,
        max_stake=source_agent.max_stake,
        daily_loss_limit=source_agent.daily_loss_limit,
    )
    db.session.add(new_agent)
    db.session.flush()

    source_rule = AgentRule.query.filter_by(agent_id=source_agent.id).first()
    if source_rule:
        new_rule = AgentRule(
            agent_id=new_agent.id,
            max_odds=source_rule.max_odds,
            min_odds=source_rule.min_odds,
            cooldown_seconds=source_rule.cooldown_seconds,
            stop_loss=source_rule.stop_loss,
            allowed_market_types=source_rule.allowed_market_types,
        )
        db.session.add(new_rule)

    listing.total_users += 1

    log = AgentLog(
        agent_id=new_agent.id,
        event_type="cloned",
        message=f"Cloned from marketplace listing: {listing.title}",
    )
    db.session.add(log)

    db.session.commit()

    return new_agent, None


def get_agents(sort_by="roi", limit=20):
    query = MarketplaceAgent.query.filter_by(public=True)

    if sort_by == "roi":
        query = query.order_by(MarketplaceAgent.roi.desc())
    elif sort_by == "rating":
        query = query.order_by(MarketplaceAgent.rating.desc())
    elif sort_by == "popularity":
        query = query.order_by(MarketplaceAgent.total_users.desc())
    elif sort_by == "win_rate":
        query = query.order_by(MarketplaceAgent.win_rate.desc())
    else:
        query = query.order_by(MarketplaceAgent.created_at.desc())

    agents = query.limit(limit).all()
    return agents


def rate_agent(marketplace_agent_id, user_id, rating, review=None):
    from app.extensions import db

    existing = MarketplaceRating.query.filter_by(
        marketplace_agent_id=marketplace_agent_id, user_id=user_id
    ).first()

    if existing:
        existing.rating = rating
        existing.review = review
    else:
        new_rating = MarketplaceRating(
            marketplace_agent_id=marketplace_agent_id,
            user_id=user_id,
            rating=rating,
            review=review,
        )
        db.session.add(new_rating)

    listing = MarketplaceAgent.query.get(marketplace_agent_id)
    if listing:
        all_ratings = MarketplaceRating.query.filter_by(
            marketplace_agent_id=marketplace_agent_id
        ).all()
        listing.rating_count = len(all_ratings)
        listing.rating = round(sum(r.rating for r in all_ratings) / len(all_ratings), 2)

    db.session.commit()
    return True


def get_leaderboard():
    top_roi = MarketplaceAgent.query.filter_by(public=True).order_by(
        MarketplaceAgent.roi.desc()
    ).limit(10).all()

    trending = MarketplaceAgent.query.filter_by(public=True).order_by(
        MarketplaceAgent.total_users.desc()
    ).limit(10).all()

    safest = MarketplaceAgent.query.filter_by(public=True).filter(
        MarketplaceAgent.win_rate >= 60
    ).order_by(
        MarketplaceAgent.win_rate.desc()
    ).limit(10).all()

    return {
        "top_roi": top_roi,
        "trending": trending,
        "safest": safest,
    }
