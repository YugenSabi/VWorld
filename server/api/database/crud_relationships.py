from sqlalchemy.orm import Session

from .models import Relationship, Agent
from .. import models


def upsert_relationship(db: Session, rel: models.RelationshipCreate) -> Relationship:
    #создает или обновляет отношение между агентами
    existing = (
        db.query(Relationship)
        .filter(
            Relationship.agent_from_id == rel.agent_from_id,
            Relationship.agent_to_id == rel.agent_to_id,
        )
        .first()
    )
    if existing:
        existing.sympathy = rel.sympathy
        db.commit()
        db.refresh(existing)
        return existing

    db_rel = Relationship(
        agent_from_id=rel.agent_from_id,
        agent_to_id=rel.agent_to_id,
        sympathy=rel.sympathy,
    )
    db.add(db_rel)
    db.commit()
    db.refresh(db_rel)
    return db_rel


def get_relationship_graph(db: Session) -> models.RelationshipGraph:
    #возвращает граф отношений между агентами
    relationships = db.query(Relationship).all()
    agent_ids = set()
    for r in relationships:
        agent_ids.add(r.agent_from_id)
        agent_ids.add(r.agent_to_id)

    agents = db.query(Agent).filter(Agent.id.in_(agent_ids)).all()

    nodes = [
        models.RelationshipGraphNode(id=a.id, name=a.name)
        for a in agents
    ]

    edges = [
        models.RelationshipGraphEdge(from_id=r.agent_from_id, to_id=r.agent_to_id, sympathy=r.sympathy)
        for r in relationships
    ]

    return models.RelationshipGraph(nodes=nodes, edges=edges)


def get_agent_relationships(db: Session, agent_id: int) -> list[Relationship]:
    #возвращает все отношения для конкретного агента
    return (
        db.query(Relationship)
        .filter(
            (Relationship.agent_from_id == agent_id) | (Relationship.agent_to_id == agent_id)
        )
        .all()
    )
