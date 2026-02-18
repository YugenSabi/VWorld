from pydantic import BaseModel, Field


class RelationshipCreate(BaseModel):
    agent_from_id: int
    agent_to_id: int
    sympathy: int = Field(ge=-10, le=10)


class RelationshipResponse(BaseModel):
    id: int
    agent_from_id: int
    agent_to_id: int
    sympathy: int

    class Config:
        from_attributes = True


class RelationshipGraphNode(BaseModel):
    id: int
    name: str


class RelationshipGraphEdge(BaseModel):
    from_id: int
    to_id: int
    sympathy: int


class RelationshipGraph(BaseModel):
    nodes: list[RelationshipGraphNode]
    edges: list[RelationshipGraphEdge]
