from pydantic import BaseModel, Field


class WeatherUpdate(BaseModel):
    weather: str


class EnvironmentEventCreate(BaseModel):
    content: str


class TimeSpeedUpdate(BaseModel):
    speed: float = Field(ge=0.1, le=10.0)


class EnvironmentResponse(BaseModel):
    weather: str
    speed: float
