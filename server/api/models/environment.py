from typing import Literal

from pydantic import BaseModel, Field


WeatherValue = Literal['sunny', 'rainy', 'cloudy', 'snowy', 'foggy', 'stormy']


class WeatherUpdate(BaseModel):
    # Request model for changing weather.
    weather: WeatherValue


class EnvironmentEventCreate(BaseModel):
    # Request model for adding an environment event.
    content: str


class TimeSpeedUpdate(BaseModel):
    # Request model for changing world time speed.
    speed: float = Field(ge=0.1, le=10.0)


class EnvironmentResponse(BaseModel):
    # Response model for current environment state.
    weather: WeatherValue
    speed: float
