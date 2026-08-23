from __future__ import annotations

from copy import deepcopy
from datetime import date, time
from pathlib import Path
from typing import Callable

from openpyxl import Workbook
import pytest

from scripts.trip_data.validation import REQUIRED_SCHEMAS, ValidationReport, validate_workbook
from scripts.validate_trip_data import main


SheetValues = dict[str, tuple[list[str], list[list[object | None]]]]
Mutator = Callable[[SheetValues], None]


def valid_workbook_values() -> SheetValues:
    values: SheetValues = {
        sheet: (list(headers), [])
        for sheet, headers in REQUIRED_SCHEMAS.items()
    }
    values["Stages"][1].append(
        [1, "Tokyo", "Tokyo", date(2026, 9, 1), date(2026, 9, 3), 2]
    )
    values["Hotels"][1].append(
        [1, "Reference Hotel", time(15), time(10), None, None, None, None, None]
    )
    values["Activities"][1].append(
        [
            "ACT001",
            "Museum",
            "Tokyo",
            None,
            "Culture",
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        ]
    )
    values["Food"][1].append(
        [
            "FOD001",
            "Dinner",
            "Tokyo",
            None,
            "Restaurant",
            "Japanese",
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        ]
    )
    values["Transport"][1].append(
        [
            "TRA001",
            1,
            date(2026, 9, 1),
            None,
            None,
            "Train",
            "Origin",
            "Destination",
            None,
            None,
            None,
            None,
        ]
    )
    values["Schedule"][1].append(
        [
            date(2026, 9, 1),
            None,
            None,
            "Note",
            None,
            "Arrival",
            "Tokyo",
            None,
            None,
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
    filename: str = "trip.xlsx",
) -> Path:
    values = valid_workbook_values()
    if mutate is not None:
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


def validate_temp(tmp_path: Path, mutate: Mutator | None = None) -> ValidationReport:
    return validate_workbook(write_workbook(tmp_path, mutate))


def codes(report: ValidationReport, severity: str | None = None) -> list[str]:
    return [
        issue.code
        for issue in report.issues
        if severity is None or issue.severity == severity
    ]


def remove_column(values: SheetValues, sheet: str, column: str) -> None:
    headers, rows = values[sheet]
    index = headers.index(column)
    headers.pop(index)
    for row in rows:
        row.pop(index)


def test_minimal_valid_workbook_has_zero_errors(tmp_path: Path) -> None:
    report = validate_temp(tmp_path)

    assert report.error_count == 0


def test_missing_required_sheet_is_detected(tmp_path: Path) -> None:
    report = validate_temp(tmp_path, lambda values: values.pop("Food"))

    assert "MISSING_SHEET" in codes(report, "error")


def test_missing_required_column_is_detected(tmp_path: Path) -> None:
    report = validate_temp(
        tmp_path,
        lambda values: remove_column(values, "Activities", "Activity_Name"),
    )

    assert "MISSING_COLUMN" in codes(report, "error")


def test_duplicate_activity_ids_are_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        values["Activities"][1].append(values["Activities"][1][0].copy())

    assert "DUPLICATE_ID" in codes(validate_temp(tmp_path, mutate), "error")


def test_duplicate_food_ids_are_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        values["Food"][1].append(values["Food"][1][0].copy())

    assert "DUPLICATE_ID" in codes(validate_temp(tmp_path, mutate), "error")


def test_duplicate_transport_ids_are_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        values["Transport"][1].append(values["Transport"][1][0].copy())

    assert "DUPLICATE_ID" in codes(validate_temp(tmp_path, mutate), "error")


@pytest.mark.parametrize(
    ("sheet", "column", "invalid_id"),
    [
        ("Activities", "Activity_ID", "ACT-1"),
        ("Food", "Food_ID", "FOOD001"),
        ("Transport", "Transport_ID", "TR001"),
    ],
)
def test_invalid_id_formats_are_detected(
    tmp_path: Path,
    sheet: str,
    column: str,
    invalid_id: str,
) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values[sheet]
        rows[0][headers.index(column)] = invalid_id

    assert "INVALID_ID_FORMAT" in codes(validate_temp(tmp_path, mutate), "error")


@pytest.mark.parametrize(
    ("reference", "expected_prefix"),
    [("ACT999", "ACT"), ("FOD999", "FOD"), ("TRA999", "TRA")],
)
def test_broken_known_references_are_detected(
    tmp_path: Path,
    reference: str,
    expected_prefix: str,
) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Schedule"]
        rows[0][headers.index("Reference")] = reference

    report = validate_temp(tmp_path, mutate)
    broken = [issue for issue in report.errors if issue.code == "BROKEN_REFERENCE"]

    assert len(broken) == 1
    assert expected_prefix in broken[0].message


def test_blank_schedule_reference_is_accepted(tmp_path: Path) -> None:
    report = validate_temp(tmp_path)

    assert "BROKEN_REFERENCE" not in codes(report)
    assert "UNKNOWN_REFERENCE_PREFIX" not in codes(report)


def test_unknown_reference_prefix_is_rejected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Schedule"]
        rows[0][headers.index("Reference")] = "HOT001"

    assert "UNKNOWN_REFERENCE_PREFIX" in codes(
        validate_temp(tmp_path, mutate), "error"
    )


def test_transport_placeholder_does_not_require_an_id(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Transport"]
        placeholder = [None] * len(headers)
        placeholder[headers.index("Stage_Order")] = 1
        rows.append(placeholder)

    report = validate_temp(tmp_path, mutate)
    row_errors = [issue for issue in report.errors if issue.row == 3]

    assert row_errors == []


def test_meaningful_transport_without_id_is_rejected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Transport"]
        rows[0][headers.index("Transport_ID")] = None

    report = validate_temp(tmp_path, mutate)

    assert any(
        issue.code == "MISSING_REQUIRED_VALUE"
        and issue.column == "Transport_ID"
        for issue in report.errors
    )


def test_transport_date_mismatch_is_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Transport"]
        rows[0][headers.index("Date")] = date(2026, 9, 2)

    assert "TRANSPORT_DATE_MISMATCH" in codes(
        validate_temp(tmp_path, mutate), "error"
    )


def test_transport_unknown_stage_is_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Transport"]
        rows[0][headers.index("Stage_Order")] = 99

    assert "UNKNOWN_STAGE" in codes(validate_temp(tmp_path, mutate), "error")


def test_hotel_unknown_stage_is_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Hotels"]
        rows[0][headers.index("Stage_Order")] = 99

    assert "UNKNOWN_STAGE" in codes(validate_temp(tmp_path, mutate), "error")


def test_duplicate_hotels_for_stage_are_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        values["Hotels"][1].append(values["Hotels"][1][0].copy())

    assert "DUPLICATE_HOTEL_STAGE" in codes(
        validate_temp(tmp_path, mutate), "error"
    )


def test_stage_date_order_is_validated(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Stages"]
        rows[0][headers.index("End_Date")] = date(2026, 8, 31)

    assert "STAGE_DATE_ORDER" in codes(validate_temp(tmp_path, mutate), "error")


def test_stage_overlap_is_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        values["Stages"][1].append(
            [2, "Kyoto", "Kyoto", date(2026, 9, 2), date(2026, 9, 4), 2]
        )

    assert "STAGE_OVERLAP" in codes(validate_temp(tmp_path, mutate), "error")


def test_nights_mismatch_is_warning_only(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Stages"]
        rows[0][headers.index("Nights")] = 1

    report = validate_temp(tmp_path, mutate)

    assert "NIGHTS_MISMATCH" in codes(report, "warning")
    assert report.error_count == 0


def test_optional_activity_fields_may_be_empty(tmp_path: Path) -> None:
    report = validate_temp(tmp_path)

    assert not any(issue.sheet == "Activities" for issue in report.errors)


def test_optional_food_fields_may_be_empty(tmp_path: Path) -> None:
    report = validate_temp(tmp_path)

    assert not any(issue.sheet == "Food" for issue in report.errors)


def test_blank_rows_are_ignored(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        for headers, rows in values.values():
            rows.append(["   "] + [None] * (len(headers) - 1))

    report = validate_temp(tmp_path, mutate)

    assert report.error_count == 0


def test_header_and_text_whitespace_is_trimmed(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        for headers, _ in values.values():
            for index, header in enumerate(headers):
                headers[index] = f"  {header}  "
        values["Activities"][1][0][0] = "  ACT001  "
        values["Food"][1][0][0] = "  FOD001  "
        values["Transport"][1][0][0] = "  TRA001  "

    report = validate_temp(tmp_path, mutate)

    assert report.error_count == 0


def test_missing_transport_id_avoids_cascaded_tra_reference_error(
    tmp_path: Path,
) -> None:
    def mutate(values: SheetValues) -> None:
        remove_column(values, "Transport", "Transport_ID")
        headers, rows = values["Schedule"]
        rows[0][headers.index("Reference")] = "TRA999"

    report = validate_temp(tmp_path, mutate)

    assert any(
        issue.code == "MISSING_COLUMN" and issue.column == "Transport_ID"
        for issue in report.errors
    )
    assert "BROKEN_REFERENCE" not in codes(report)


def test_duplicate_trimmed_headers_are_detected(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Activities"]
        headers.append(" Activity_ID ")
        rows[0].append("ACT999")

    assert "DUPLICATE_HEADER" in codes(validate_temp(tmp_path, mutate), "error")


def test_transport_notes_underscore_alias_is_accepted(tmp_path: Path) -> None:
    def mutate(values: SheetValues) -> None:
        headers, _ = values["Transport"]
        headers.append("Our_Notes")

    report = validate_temp(tmp_path, mutate)

    assert report.error_count == 0


def test_cli_returns_zero_for_valid_workbook(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    path = write_workbook(tmp_path)

    assert main([str(path)]) == 0
    assert "Validation passed" in capsys.readouterr().out


def test_cli_returns_zero_when_only_warnings_exist(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    def mutate(values: SheetValues) -> None:
        headers, rows = values["Stages"]
        rows[0][headers.index("Nights")] = 1

    path = write_workbook(tmp_path, mutate)

    assert main([str(path)]) == 0
    assert "1 warning(s)" in capsys.readouterr().out


def test_cli_returns_one_when_errors_exist(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    path = write_workbook(tmp_path, lambda values: values.pop("Food"))

    assert main([str(path)]) == 1
    assert "Validation failed" in capsys.readouterr().out


def test_cli_returns_two_when_workbook_cannot_open(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    path = tmp_path / "missing.xlsx"

    assert main([str(path)]) == 2
    assert "Validation could not run" in capsys.readouterr().err
