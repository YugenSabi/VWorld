from pydantic import BaseModel


class MoodUpdate(BaseModel):
    #обновляет настроение агента
    mood: str
