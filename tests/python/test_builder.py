from __future__ import annotations

from copy import deepcopy
from datetime import date, time
import json
from pathlib import Path
from typing import Callable

from openpyxl import Workbook
import pytest

import scripts.build_trip_data as build_cli
from scripts.trip_data.builder import (
    build_trip_data,
    serialize_trip_data,
    write_trip_data,
)
from scripts.trip_data.validation import REQUIRED_SCHEMAS, validate_data
from scripts.trip_data.workbook import read_workbook


SheetValues = dict[str, tuple[list[str], list[list[object | None]]]]
Mutator = Callable[[SheetValues], None]


def valid_builder_values() -> SheetValues:
    values: SheetValues = {
        sheet: (list(headers), [])
        for sheet, headers in REQUIRED_SCHEMAS.items()
    }
    values["Transport"][0].append("Our Notes")
    values["Stages"][1].extend(
        [
            [1, "Tokyo", "東京", date(2026, 9, 1), date(2026, 9, 2), 1],
            [2, "Kyoto", "京都", date(2026, 9, 2), date(2026, 9, 4), 2],
        ]
    )
    values["Hotels"][1].extend(
        [
            [
                1,
                "Tokyo Hotel",
                time(15),
                time(10),
                "Tokyo address",
                "https://private.example/SECRET-BOOKING-TOKEN-123",
                "Lobby on level 2",
                None,
                None,
            ],
            [
                2,
                "Kyoto Hotel",
                time(16),
                time(11),
                "Kyoto address",
                None,
                None,
                None,
                None,
            ],
        ]
    )
    values["Activities"][1].append(
        [
            "ACT001",
            "Sensō-ji",
            "Tokyo",
            "Asakusa",
            "Temple",
            75,
            None,
            "X",
            "Recommended",
            None,
            "Remove shoes where indicated",
            None,
            None,
            None,
        ]
    )
    values["Food"][1].append(
        [
            "FOD001",
            "Ramen",
            "Kyoto",
            "Kyoto Station",
            "Meal",
            "Japanese",
            None,
            "Walk-in",
            None,
            None,
            "Order at the machine",
            None,
            None,
            None,
        ]
    )
    values["Transport"][1].extend(
        [
            [
                "TRA001",
                1,
                date(2026, 9, 1),
                time(9),
                time(10),
                "Train",
                "Airport",
                "Tokyo",
                "Express",
                "Booked",
                "Use the reserved carriage",
                None,
                "Platform details later",
            ],
            [
                None,
                2,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                "To be completed later",
            ],
        ]
    )
    values["Schedule"][1].append(
        [
            date(2026, 9, 1),
            time(12, 30),
            None,
            "Activity",
            "ACT001",
            None,
            None,
            None,
            "Planned",
            None,
            None,
            None,
        ]
    )
    return deepcopy(values)


def write_workbook(
    tmp_path: Path,
    mutate: Mutator | None = None,
    *,
    filename: str = "builder.xlsx",
) -> Path:
    values = valid_builder_values()
    if mutate:
        mutate(values)

    workbook = Workbook()
    workbook.remove(workbook.active)
    for sheet_name, (headers, rows) in values.items():
        worksheet = workbook.create_sheet(sheet_name)
        worksheet.append(headers)
        for row in rows:
            worksheet.append(row)
    path = tmp_path / filename
    workbook.save(path)
    workbook.close()
    return path


def build_from_temp(
    tmp_path: Path,
    mutate: Mutator | None = None,
) -> dict[str, object]:
    data = read_workbook(write_workbook(tmp_path, mutate))
    report = validate_data(data)
    assert report.error_count == 0
    return build_trip_data(data)


def add_schedule(values: SheetValues, **fields: object | None) -> None:
    headers, rows = values["Schedule"]
    row: list[object | None] = [None] * len(headers)
    for column, value in fields.items():
        row[headers.index(column)] = value
    rows.append(row)


def timeline_for(
    payload: dict[str, object],
    day: str,
) -> list[dict[str, object]]:
    days = payload["days"]
    assert isinstance(days, dict)
    day_data = days[day]
    assert isinstance(day_data, dict)
    timeline = day_data["timeline"]
    assert isinstance(timeline, list)
    return timeline


def referenced_item(
    payload: dict[str, object],
    reference: str,
) -> dict[str, object]:
    for day in payload["days"].values():
        for item in day["timeline"]:
            if item.get("reference") == reference:
                return item
    raise AssertionError(f"Timeline reference not found: {reference}")


def test_valid_workbook_builds_normalized_json(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    assert payload["schemaVersion"] == 1
    assert set(payload) == {
        "schemaVersion",
        "trip",
        "stages",
        "activities",
        "food",
        "transports",
        "hotels",
        "days",
        "reminders",
    }


def test_validation_errors_prevent_output(tmp_path: Path) -> None:
    path = write_workbook(tmp_path, lambda values: values.pop("Food"))
    output = tmp_path / "trip.json"

    assert build_cli.main([str(path), "--output", str(output)]) == 1
    assert not output.exists()


def test_exclusive_end_schedule_blocks_build_without_writing_output(
    tmp_path: Path,
) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Schedule"]
        rows[0][headers.index("Date")] = date(2026, 9, 4)

    path = write_workbook(tmp_path, mutate)
    output = tmp_path / "trip.json"

    assert build_cli.main([str(path), "--output", str(output)]) == 1
    assert not output.exists()


def test_existing_output_is_not_overwritten_when_validation_fails(
    tmp_path: Path,
) -> None:
    path = write_workbook(tmp_path, lambda values: values.pop("Food"))
    output = tmp_path / "trip.json"
    output.write_text("existing-valid-output\n", encoding="utf-8")

    assert build_cli.main([str(path), "--output", str(output)]) == 1
    assert output.read_text(encoding="utf-8") == "existing-valid-output\n"


def test_warnings_do_not_block_output(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        values["Stages"][1][0][-1] = 0

    path = write_workbook(tmp_path, mutate)
    output = tmp_path / "trip.json"

    assert build_cli.main([str(path), "--output", str(output)]) == 0
    assert output.exists()


def test_json_generation_is_deterministic(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)
    first = serialize_trip_data(payload).encode("utf-8")
    second = serialize_trip_data(payload).encode("utf-8")

    assert first == second
    assert first.endswith(b"\n")


def test_dates_serialize_as_iso_dates(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    assert payload["stages"][0]["startDate"] == "2026-09-01"
    assert payload["transports"]["TRA001"]["date"] == "2026-09-01"


def test_times_serialize_as_hours_and_minutes(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    assert payload["transports"]["TRA001"]["startTime"] == "09:00"
    assert payload["hotels"]["1"]["checkinTime"] == "15:00"
    assert referenced_item(payload, "ACT001")["startTime"] == "12:30"


def test_unicode_is_preserved_in_serialized_json(tmp_path: Path) -> None:
    serialized = serialize_trip_data(build_from_temp(tmp_path))

    assert "東京" in serialized
    assert "\\u6771" not in serialized


def test_trip_end_date_is_exclusive(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    assert payload["trip"]["endDate"] == "2026-09-04"
    assert "2026-09-04" not in payload["days"]


def test_total_days_uses_exclusive_end_date(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    assert payload["trip"]["totalDays"] == 3


def test_day_one_is_the_trip_start(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    assert payload["days"]["2026-09-01"]["dayNumber"] == 1


def test_final_day_is_end_date_minus_one_day(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    assert payload["days"]["2026-09-03"]["dayNumber"] == 3
    assert list(payload["days"])[-1] == "2026-09-03"


def test_stage_boundary_date_belongs_to_next_stage(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    boundary = payload["days"]["2026-09-02"]
    assert boundary["stageOrder"] == 2
    assert boundary["city"] == "Kyoto"


def test_activities_are_keyed_by_activity_id(tmp_path: Path) -> None:
    activities = build_from_temp(tmp_path)["activities"]

    assert list(activities) == ["ACT001"]
    assert activities["ACT001"]["id"] == "ACT001"


def test_food_is_keyed_by_food_id(tmp_path: Path) -> None:
    food = build_from_temp(tmp_path)["food"]

    assert list(food) == ["FOD001"]
    assert food["FOD001"]["id"] == "FOD001"


def test_transport_uses_explicit_transport_id(tmp_path: Path) -> None:
    transports = build_from_temp(tmp_path)["transports"]

    assert list(transports) == ["TRA001"]
    assert "TRA002" not in transports


def test_transport_placeholder_rows_are_excluded(tmp_path: Path) -> None:
    transports = build_from_temp(tmp_path)["transports"]

    assert len(transports) == 1


def test_hotels_are_keyed_by_stage_order(tmp_path: Path) -> None:
    hotels = build_from_temp(tmp_path)["hotels"]

    assert set(hotels) == {"1", "2"}
    assert hotels["2"]["stageOrder"] == 2


def test_booking_link_is_absent_from_serialized_output(tmp_path: Path) -> None:
    serialized = serialize_trip_data(build_from_temp(tmp_path))

    assert "SECRET-BOOKING-TOKEN-123" not in serialized
    assert "Booking_Link" not in serialized
    assert "bookingLink" not in serialized


def test_blank_optional_values_become_null(tmp_path: Path) -> None:
    activity = build_from_temp(tmp_path)["activities"]["ACT001"]

    assert "about" in activity
    assert activity["about"] is None
    assert activity["websiteLink"] is None


def test_activity_favorite_x_becomes_true(tmp_path: Path) -> None:
    activity = build_from_temp(tmp_path)["activities"]["ACT001"]

    assert activity["favorite"] is True


def test_blank_food_favorite_becomes_false(tmp_path: Path) -> None:
    food = build_from_temp(tmp_path)["food"]["FOD001"]

    assert food["favorite"] is False


def test_activity_reference_fills_missing_schedule_fields(tmp_path: Path) -> None:
    item = referenced_item(build_from_temp(tmp_path), "ACT001")

    assert item["title"] == "Sensō-ji"
    assert item["city"] == "Tokyo"
    assert item["area"] == "Asakusa"
    assert item["durationMin"] == 75
    assert item["favorite"] is True
    assert item["reservation"] == "Recommended"


def test_schedule_values_override_activity_values(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Schedule"]
        overrides = {
            "Title": "Planned title",
            "City": "Planned city",
            "Area": "Planned area",
            "Duration_Min": 30,
            "Info": "Planning info",
            "Important": "Planning priority",
        }
        for column, value in overrides.items():
            rows[0][headers.index(column)] = value

    item = referenced_item(build_from_temp(tmp_path, mutate), "ACT001")

    assert item["title"] == "Planned title"
    assert item["city"] == "Planned city"
    assert item["area"] == "Planned area"
    assert item["durationMin"] == 30
    assert item["info"] == "Planning info"
    assert item["important"] == "Planning priority"


def test_food_reference_enrichment_works(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        add_schedule(
            values,
            Date=date(2026, 9, 2),
            Type="Food",
            Reference="FOD001",
            Status="Planned",
        )

    item = referenced_item(build_from_temp(tmp_path, mutate), "FOD001")

    assert item["type"] == "food"
    assert item["title"] == "Ramen"
    assert item["area"] == "Kyoto Station"
    assert item["favorite"] is False
    assert item["reservation"] == "Walk-in"


def test_transport_reference_enrichment_works(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        add_schedule(
            values,
            Date=date(2026, 9, 1),
            Type="Transport",
            Reference="TRA001",
            Status="Planned",
        )

    item = referenced_item(build_from_temp(tmp_path, mutate), "TRA001")

    assert item["title"] == "Airport → Tokyo"
    assert item["mode"] == "Train"
    assert item["from"] == "Airport"
    assert item["to"] == "Tokyo"
    assert item["service"] == "Express"


def test_referenced_transport_is_major(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        add_schedule(
            values,
            Date=date(2026, 9, 1),
            Type="Transport",
            Reference="TRA001",
        )

    item = referenced_item(build_from_temp(tmp_path, mutate), "TRA001")

    assert item["isMajorTransport"] is True


def test_unreferenced_transport_is_local(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        add_schedule(
            values,
            Date=date(2026, 9, 2),
            Type="Transport",
            Title="Walk to station",
        )

    payload = build_from_temp(tmp_path, mutate)
    item = next(
        entry
        for entry in timeline_for(payload, "2026-09-02")
        if entry.get("title") == "Walk to station"
    )

    assert item["isMajorTransport"] is False


def test_flexible_activity_creates_discovery_metadata(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        add_schedule(
            values,
            Date=date(2026, 9, 2),
            Type="Flexible",
            Title="Flexible afternoon",
            City="Kyoto",
            Area=None,
        )

    payload = build_from_temp(tmp_path, mutate)
    item = next(
        entry
        for entry in timeline_for(payload, "2026-09-02")
        if entry.get("type") == "flexible"
    )

    assert item["discovery"] == {
        "mode": "activities",
        "city": "Kyoto",
        "area": None,
    }


def test_flexible_food_creates_meal_discovery_metadata(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        add_schedule(
            values,
            Date=date(2026, 9, 2),
            Type="Food",
            Title="Flexible lunch",
            City="Kyoto",
            Area="Kyoto Station",
            Status="Flexible",
        )

    payload = build_from_temp(tmp_path, mutate)
    item = next(
        entry
        for entry in timeline_for(payload, "2026-09-02")
        if entry.get("title") == "Flexible lunch"
    )

    assert item["discovery"] == {
        "mode": "food",
        "city": "Kyoto",
        "area": "Kyoto Station",
        "category": "Meal",
    }


def test_hotel_checkin_is_injected_on_stage_start(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    stage_two_timeline = timeline_for(payload, "2026-09-02")
    assert any(
        item.get("type") == "hotel"
        and item.get("hotelStageOrder") == 2
        and item.get("title") == "Kyoto Hotel"
        for item in stage_two_timeline
    )


def test_hotel_checkin_respects_time_insertion_rule(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        values["Schedule"][1].clear()
        add_schedule(
            values,
            Date=date(2026, 9, 1),
            Start_Time=time(10),
            Type="Activity",
            Title="Morning",
        )
        add_schedule(
            values,
            Date=date(2026, 9, 1),
            Type="Activity",
            Title="Untimed",
        )
        add_schedule(
            values,
            Date=date(2026, 9, 1),
            Start_Time=time(18),
            Type="Activity",
            Title="Evening",
        )

    timeline = timeline_for(build_from_temp(tmp_path, mutate), "2026-09-01")

    assert [item["title"] for item in timeline] == [
        "Morning",
        "Untimed",
        "Tokyo Hotel",
        "Evening",
    ]


def test_reminders_is_always_an_empty_array(tmp_path: Path) -> None:
    payload = build_from_temp(tmp_path)

    assert payload["reminders"] == []


def test_cli_success_returns_zero_and_writes_json(tmp_path: Path) -> None:
    path = write_workbook(tmp_path)
    output = tmp_path / "output" / "trip.json"

    assert build_cli.main([str(path), "--output", str(output)]) == 0
    assert json.loads(output.read_text(encoding="utf-8"))["schemaVersion"] == 1


def test_cli_validation_block_returns_one(tmp_path: Path) -> None:
    path = write_workbook(tmp_path, lambda values: values.pop("Stages"))

    assert build_cli.main([str(path), "--output", str(tmp_path / "trip.json")]) == 1


def test_cli_runtime_failure_returns_two(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail_read(_: Path) -> None:
        raise OSError("simulated failure")

    monkeypatch.setattr(build_cli, "read_workbook", fail_read)

    assert build_cli.main([str(tmp_path / "input.xlsx")]) == 2


def test_serialization_failure_preserves_existing_output(tmp_path: Path) -> None:
    output = tmp_path / "trip.json"
    output.write_text("existing\n", encoding="utf-8")

    with pytest.raises(ValueError):
        write_trip_data({"invalid": float("nan")}, output)

    assert output.read_text(encoding="utf-8") == "existing\n"
