"""Build the normalized frontend trip model from validated workbook data."""

from __future__ import annotations

from datetime import date, time, timedelta
import json
import os
from pathlib import Path
import tempfile
from typing import Final

from .validation import is_meaningful_transport_row
from .workbook import SheetData, WorkbookData, WorkbookRow


REFERENCE_TYPES: Final = {
    "ACT": "activity",
    "FOD": "food",
    "TRA": "transport",
}


class TripDataBuildError(RuntimeError):
    """Raised when validated workbook data cannot be converted safely."""


def _required_sheet(data: WorkbookData, name: str) -> SheetData:
    sheet = data.get_sheet(name)
    if sheet is None:
        raise TripDataBuildError(f"Required sheet unavailable during build: {name}")
    return sheet


def _required_int(row: WorkbookRow, column: str) -> int:
    value = row.get(column)
    if not isinstance(value, int) or isinstance(value, bool):
        raise TripDataBuildError(f"Expected validated integer: {column}")
    return value


def _required_text(row: WorkbookRow, column: str) -> str:
    value = row.get(column)
    if not isinstance(value, str):
        raise TripDataBuildError(f"Expected validated text: {column}")
    return value


def _required_date(row: WorkbookRow, column: str) -> date:
    value = row.get(column)
    if not isinstance(value, date):
        raise TripDataBuildError(f"Expected validated date: {column}")
    return value


def _date_text(value: date) -> str:
    return value.isoformat()


def _time_text(value: object | None) -> str | None:
    if value is None:
        return None
    if not isinstance(value, time):
        raise TripDataBuildError("Expected a validated time value")
    return value.strftime("%H:%M")


def _favorite(value: object | None) -> bool:
    return isinstance(value, str) and value.strip().casefold() == "x"


def _first_present(*values: object | None) -> object | None:
    return next((value for value in values if value is not None), None)


def _sorted_entity_rows(sheet: SheetData, id_column: str) -> list[WorkbookRow]:
    return sorted(sheet.rows, key=lambda row: str(row.get(id_column)))


def _build_stages(data: WorkbookData) -> list[dict[str, object]]:
    rows = sorted(
        _required_sheet(data, "Stages").rows,
        key=lambda row: _required_int(row, "Stage_Order"),
    )
    return [
        {
            "stageOrder": _required_int(row, "Stage_Order"),
            "city": _required_text(row, "City"),
            "japaneseName": row.get("Japanese_Name"),
            "startDate": _date_text(_required_date(row, "Start_Date")),
            "endDate": _date_text(_required_date(row, "End_Date")),
            "nights": row.get("Nights"),
        }
        for row in rows
    ]


def _build_activities(data: WorkbookData) -> dict[str, dict[str, object]]:
    activities: dict[str, dict[str, object]] = {}
    for row in _sorted_entity_rows(
        _required_sheet(data, "Activities"), "Activity_ID"
    ):
        identifier = _required_text(row, "Activity_ID")
        activities[identifier] = {
            "id": identifier,
            "name": _required_text(row, "Activity_Name"),
            "city": row.get("City"),
            "area": row.get("Area"),
            "category": row.get("Category"),
            "durationMin": row.get("Duration_Min"),
            "weather": row.get("Weather"),
            "favorite": _favorite(row.get("Favorite")),
            "reservation": row.get("Reservation"),
            "about": row.get("About"),
            "info": row.get("Info"),
            "important": row.get("Important"),
            "ourNotes": row.get("Our_Notes"),
            "websiteLink": row.get("Website_Link"),
        }
    return activities


def _build_food(data: WorkbookData) -> dict[str, dict[str, object]]:
    food: dict[str, dict[str, object]] = {}
    for row in _sorted_entity_rows(_required_sheet(data, "Food"), "Food_ID"):
        identifier = _required_text(row, "Food_ID")
        food[identifier] = {
            "id": identifier,
            "name": _required_text(row, "Food_Name"),
            "city": row.get("City"),
            "area": row.get("Area"),
            "category": row.get("Category"),
            "foodType": row.get("Food_Type"),
            "favorite": _favorite(row.get("Favorite")),
            "reservation": row.get("Reservation"),
            "price": row.get("Price"),
            "about": row.get("About"),
            "info": row.get("Info"),
            "important": row.get("Important"),
            "ourNotes": row.get("Our_Notes"),
            "websiteLink": row.get("Website_Link"),
        }
    return food


def _build_transports(data: WorkbookData) -> dict[str, dict[str, object]]:
    meaningful_rows = [
        row
        for row in _required_sheet(data, "Transport").rows
        if is_meaningful_transport_row(row)
    ]
    transports: dict[str, dict[str, object]] = {}
    for row in sorted(
        meaningful_rows,
        key=lambda item: str(item.get("Transport_ID")),
    ):
        identifier = _required_text(row, "Transport_ID")
        transports[identifier] = {
            "id": identifier,
            "stageOrder": _required_int(row, "Stage_Order"),
            "date": _date_text(_required_date(row, "Date")),
            "startTime": _time_text(row.get("Start_Time")),
            "endTime": _time_text(row.get("End_Time")),
            "mode": row.get("Mode"),
            "from": row.get("From"),
            "to": row.get("To"),
            "service": row.get("Service"),
            "status": row.get("Status"),
            "info": row.get("Info"),
            "important": row.get("Important"),
            "ourNotes": row.get("Our Notes"),
        }
    return transports


def _build_hotels(data: WorkbookData) -> dict[str, dict[str, object]]:
    hotels: dict[str, dict[str, object]] = {}
    rows = sorted(
        _required_sheet(data, "Hotels").rows,
        key=lambda row: _required_int(row, "Stage_Order"),
    )
    for row in rows:
        stage_order = _required_int(row, "Stage_Order")
        hotels[str(stage_order)] = {
            "stageOrder": stage_order,
            "name": _required_text(row, "Hotel_Name"),
            "checkinTime": _time_text(row.get("Checkin_Time")),
            "checkoutTime": _time_text(row.get("Checkout_Time")),
            "address": row.get("Address"),
            "info": row.get("Info"),
            "important": row.get("Important"),
            "ourNotes": row.get("Our_Notes"),
        }
    return hotels


def _normalize_timeline_type(
    schedule_type: object | None,
    reference: object | None,
) -> str:
    if isinstance(reference, str) and reference[:3] in REFERENCE_TYPES:
        return REFERENCE_TYPES[reference[:3]]
    if not isinstance(schedule_type, str):
        raise TripDataBuildError("Expected validated Schedule Type")
    return schedule_type.strip().casefold()


def _transport_title(transport: dict[str, object]) -> str:
    origin = transport.get("from")
    destination = transport.get("to")
    if isinstance(origin, str) and isinstance(destination, str):
        return f"{origin} → {destination}"
    service = transport.get("service")
    if isinstance(service, str):
        return service
    return "Transport"


def _build_timeline_item(
    row: WorkbookRow,
    activities: dict[str, dict[str, object]],
    food: dict[str, dict[str, object]],
    transports: dict[str, dict[str, object]],
) -> dict[str, object]:
    reference = row.get("Reference")
    timeline_type = _normalize_timeline_type(row.get("Type"), reference)
    entity: dict[str, object] | None = None
    if isinstance(reference, str):
        prefix = reference[:3]
        if prefix == "ACT":
            entity = activities.get(reference)
        elif prefix == "FOD":
            entity = food.get(reference)
        elif prefix == "TRA":
            entity = transports.get(reference)
        if entity is None:
            raise TripDataBuildError("Validated Schedule reference is unavailable")

    title_fallback = entity.get("name") if entity else None
    if timeline_type == "transport" and entity:
        title_fallback = _transport_title(entity)

    item: dict[str, object] = {
        "type": timeline_type,
        "reference": reference,
        "title": _first_present(row.get("Title"), title_fallback),
        "city": _first_present(
            row.get("City"), entity.get("city") if entity else None
        ),
        "area": _first_present(
            row.get("Area"), entity.get("area") if entity else None
        ),
        "startTime": _time_text(row.get("Start_Time")),
        "endTime": _time_text(row.get("End_Time")),
        "durationMin": _first_present(
            row.get("Duration_Min"),
            entity.get("durationMin") if entity else None,
        ),
        "status": row.get("Status"),
        "info": _first_present(
            row.get("Info"), entity.get("info") if entity else None
        ),
        "important": _first_present(
            row.get("Important"),
            entity.get("important") if entity else None,
        ),
    }

    if timeline_type in {"activity", "food"} and entity:
        item["favorite"] = entity.get("favorite", False)
        item["reservation"] = entity.get("reservation")

    if timeline_type == "transport":
        item["isMajorTransport"] = isinstance(reference, str) and reference.startswith(
            "TRA"
        )
        if entity:
            item["mode"] = entity.get("mode")
            item["from"] = entity.get("from")
            item["to"] = entity.get("to")
            item["service"] = entity.get("service")

    schedule_type = row.get("Type")
    status = row.get("Status")
    if reference is None and isinstance(schedule_type, str):
        normalized_type = schedule_type.strip().casefold()
        if normalized_type == "flexible":
            item["discovery"] = {
                "mode": "activities",
                "city": row.get("City"),
                "area": row.get("Area"),
            }
        elif (
            normalized_type == "food"
            and isinstance(status, str)
            and status.strip().casefold() == "flexible"
        ):
            item["discovery"] = {
                "mode": "food",
                "city": row.get("City"),
                "area": row.get("Area"),
                "category": "Meal",
            }

    return item


def _build_days(
    data: WorkbookData,
    stages: list[dict[str, object]],
    activities: dict[str, dict[str, object]],
    food: dict[str, dict[str, object]],
    transports: dict[str, dict[str, object]],
    hotels: dict[str, dict[str, object]],
) -> dict[str, dict[str, object]]:
    start_date = date.fromisoformat(str(stages[0]["startDate"]))
    end_date = max(date.fromisoformat(str(stage["endDate"])) for stage in stages)
    days: dict[str, dict[str, object]] = {}

    current_date = start_date
    day_number = 1
    while current_date < end_date:
        stage = next(
            (
                candidate
                for candidate in stages
                if date.fromisoformat(str(candidate["startDate"]))
                <= current_date
                < date.fromisoformat(str(candidate["endDate"]))
            ),
            None,
        )
        date_key = _date_text(current_date)
        days[date_key] = {
            "date": date_key,
            "dayNumber": day_number,
            "stageOrder": stage.get("stageOrder") if stage else None,
            "city": stage.get("city") if stage else None,
            "japaneseName": stage.get("japaneseName") if stage else None,
            "timeline": [],
        }
        current_date += timedelta(days=1)
        day_number += 1

    for row in _required_sheet(data, "Schedule").rows:
        schedule_date = _required_date(row, "Date")
        day = days.get(_date_text(schedule_date))
        if day is None:
            raise TripDataBuildError("Validated Schedule date is outside the trip")
        timeline = day["timeline"]
        if not isinstance(timeline, list):
            raise TripDataBuildError("Invalid timeline structure")
        timeline.append(_build_timeline_item(row, activities, food, transports))

    for stage in stages:
        stage_order = stage["stageOrder"]
        hotel = hotels.get(str(stage_order))
        day = days.get(str(stage["startDate"]))
        if hotel is None or day is None:
            continue
        hotel_item: dict[str, object] = {
            "type": "hotel",
            "reference": None,
            "hotelStageOrder": stage_order,
            "title": hotel["name"],
            "city": stage["city"],
            "area": None,
            "startTime": hotel["checkinTime"],
            "endTime": None,
            "durationMin": None,
            "status": None,
            "info": hotel["info"],
            "important": hotel["important"],
        }
        timeline = day["timeline"]
        if not isinstance(timeline, list):
            raise TripDataBuildError("Invalid timeline structure")
        checkin_time = hotel["checkinTime"]
        insert_at = len(timeline)
        if isinstance(checkin_time, str):
            for index, item in enumerate(timeline):
                item_time = item.get("startTime") if isinstance(item, dict) else None
                if isinstance(item_time, str) and item_time > checkin_time:
                    insert_at = index
                    break
        timeline.insert(insert_at, hotel_item)

    return days


def build_trip_data(data: WorkbookData) -> dict[str, object]:
    """Build the normalized trip application model from validated data."""

    stages = _build_stages(data)
    if not stages:
        raise TripDataBuildError("At least one Stage is required to build trip data")

    activities = _build_activities(data)
    food = _build_food(data)
    transports = _build_transports(data)
    hotels = _build_hotels(data)
    start_date = date.fromisoformat(str(stages[0]["startDate"]))
    end_date = max(date.fromisoformat(str(stage["endDate"])) for stage in stages)
    days = _build_days(data, stages, activities, food, transports, hotels)

    return {
        "schemaVersion": 1,
        "trip": {
            "name": "Japan 2026",
            "timeZone": "Asia/Tokyo",
            "startDate": _date_text(start_date),
            "endDate": _date_text(end_date),
            "totalDays": (end_date - start_date).days,
        },
        "stages": stages,
        "activities": activities,
        "food": food,
        "transports": transports,
        "hotels": hotels,
        "days": days,
        "reminders": [],
    }


def serialize_trip_data(trip_data: dict[str, object]) -> str:
    """Serialize trip data deterministically as UTF-8-compatible JSON text."""

    return json.dumps(
        trip_data,
        ensure_ascii=False,
        indent=2,
        allow_nan=False,
    ) + "\n"


def write_trip_data(trip_data: dict[str, object], output: str | Path) -> None:
    """Atomically write complete JSON so partial output is never exposed."""

    content = serialize_trip_data(trip_data)
    destination = Path(output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        dir=destination.parent,
        prefix=f".{destination.name}.",
        suffix=".tmp",
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(
            descriptor,
            "w",
            encoding="utf-8",
            newline="\n",
        ) as temporary_file:
            temporary_file.write(content)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        temporary_path.replace(destination)
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise
