from pydantic import BaseModel, Field


class WeatherUpdate(BaseModel):
    #обновляет погоду в окружении
    weather: str


class EnvironmentEventCreate(BaseModel):
    #создает новое событие в окружении
    content: str


class TimeSpeedUpdate(BaseModel):
    #обновляет скорость времени в окружении
    speed: float = Field(ge=0.1, le=10.0)


class EnvironmentResponse(BaseModel):
    #возвращает состояние окружения
    weather: str
    speed: float
