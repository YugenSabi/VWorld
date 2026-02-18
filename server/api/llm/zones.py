from dataclasses import dataclass


@dataclass(frozen=True)
class Zone:
    name: str
    label: str
    x1: float
    y1: float
    x2: float
    y2: float

    def contains(self, x: float, y: float) -> bool:
        return self.x1 <= x <= self.x2 and self.y1 <= y <= self.y2

    def center(self) -> tuple[float, float]:
        return ((self.x1 + self.x2) / 2, (self.y1 + self.y2) / 2)


ZONES: list[Zone] = [
    Zone(name="park",    label="парк",         x1=34.0, y1=44.0, x2=43.0, y2=58.0),
    Zone(name="road",    label="дорога",        x1=43.0, y1=44.0, x2=54.0, y2=58.0),
    Zone(name="square",  label="площадь",       x1=54.0, y1=44.0, x2=68.0, y2=58.0),
    Zone(name="north",   label="северный район", x1=34.0, y1=44.0, x2=68.0, y2=50.0),
    Zone(name="south",   label="южный район",   x1=34.0, y1=52.0, x2=68.0, y2=66.0),
]

PRIMARY_ZONES = [z for z in ZONES if z.name in ("park", "road", "square")]


def get_zone(x: float, y: float) -> Zone | None:
    for zone in PRIMARY_ZONES:
        if zone.contains(x, y):
            return zone
    return None


def get_zone_label(x: float, y: float) -> str:
    zone = get_zone(x, y)
    return zone.label if zone else "неизвестная зона"


def get_zone_by_name(name: str) -> Zone | None:
    for zone in PRIMARY_ZONES:
        if zone.name == name:
            return zone
    return None
