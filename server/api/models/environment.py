from typing import Literal

from pydantic import BaseModel, Field


WeatherValue = Literal['sunny', 'rainy', 'cloudy', 'snowy', 'foggy', 'stormy']


class WeatherUpdate(BaseModel):
    weather: WeatherValue


class EnvironmentEventCreate(BaseModel):
    content: str


class TimeSpeedUpdate(BaseModel):
    speed: float = Field(ge=0.1, le=10.0)


class EnvironmentResponse(BaseModel):
    weather: WeatherValue
    speed: float
