from pydantic import BaseModel


class MoodUpdate(BaseModel):
    mood: str
