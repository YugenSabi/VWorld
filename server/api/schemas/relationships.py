from pydantic import BaseModel, Field


class RelationshipCreate(BaseModel):
    #создает или обновляет отношение между агентами
    agent_from_id: int
    agent_to_id: int
    sympathy: int = Field(ge=-10, le=10)


class RelationshipResponse(BaseModel):
    #возвращает данные отношения
    id: int
    agent_from_id: int
    agent_to_id: int
    sympathy: int

    class Config:
        from_attributes = True


class RelationshipGraphNode(BaseModel):
    #узел в графе отношений
    id: int
    name: str


class RelationshipGraphEdge(BaseModel):
    #ребро в графе отношений
    from_id: int
    to_id: int
    sympathy: int


class RelationshipGraph(BaseModel):
    #полный граф отношений
    nodes: list[RelationshipGraphNode]
    edges: list[RelationshipGraphEdge]
