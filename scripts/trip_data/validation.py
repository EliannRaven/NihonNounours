"""Validation rules for the normalized NihonNounours trip workbook."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from datetime import date, time
from pathlib import Path
import re
from typing import Final, Literal

from .workbook import SheetData, WorkbookData, WorkbookRow, read_workbook


Severity = Literal["error", "warning"]


REQUIRED_SCHEMAS: Final[dict[str, tuple[str, ...]]] = {
    "Stages": (
        "Stage_Order",
        "City",
        "Japanese_Name",
        "Start_Date",
        "End_Date",
        "Nights",
    ),
    "Hotels": (
        "Stage_Order",
        "Hotel_Name",
        "Checkin_Time",
        "Checkout_Time",
        "Address",
        "Booking_Link",
        "Info",
        "Important",
        "Our_Notes",
    ),
    "Activities": (
        "Activity_ID",
        "Activity_Name",
        "City",
        "Area",
        "Category",
        "Duration_Min",
        "Weather",
        "Favorite",
        "Reservation",
        "About",
        "Info",
        "Important",
        "Our_Notes",
        "Website_Link",
    ),
    "Food": (
        "Food_ID",
        "Food_Name",
        "City",
        "Area",
        "Category",
        "Food_Type",
        "Favorite",
        "Reservation",
        "Price",
        "About",
        "Info",
        "Important",
        "Our_Notes",
        "Website_Link",
    ),
    "Schedule": (
        "Date",
        "Start_Time",
        "End_Time",
        "Type",
        "Reference",
        "Title",
        "City",
        "Area",
        "Status",
        "Duration_Min",
        "Info",
        "Important",
    ),
    "Transport": (
        "Transport_ID",
        "Stage_Order",
        "Date",
        "Start_Time",
        "End_Time",
        "Mode",
        "From",
        "To",
        "Service",
        "Status",
        "Info",
        "Important",
    ),
}

ID_PATTERNS: Final = {
    "Activity_ID": re.compile(r"^ACT\d+$"),
    "Food_ID": re.compile(r"^FOD\d+$"),
    "Transport_ID": re.compile(r"^TRA\d+$"),
}


@dataclass(frozen=True)
class ValidationIssue:
    """One stable, location-aware validation diagnostic."""

    severity: Severity
    code: str
    message: str
    sheet: str
    row: int | None = None
    column: str | None = None


@dataclass
class ValidationReport:
    """Validation result with errors and warnings kept distinct."""

    workbook: Path
    issues: list[ValidationIssue] = field(default_factory=list)

    @property
    def errors(self) -> list[ValidationIssue]:
        return [issue for issue in self.issues if issue.severity == "error"]

    @property
    def warnings(self) -> list[ValidationIssue]:
        return [issue for issue in self.issues if issue.severity == "warning"]

    @property
    def error_count(self) -> int:
        return len(self.errors)

    @property
    def warning_count(self) -> int:
        return len(self.warnings)

    def add(
        self,
        severity: Severity,
        code: str,
        message: str,
        sheet: str,
        *,
        row: int | None = None,
        column: str | None = None,
    ) -> None:
        self.issues.append(
            ValidationIssue(
                severity=severity,
                code=code,
                message=message,
                sheet=sheet,
                row=row,
                column=column,
            )
        )


@dataclass(frozen=True)
class StageRecord:
    order: int
    start_date: date
    end_date: date
    row: int


def _is_integer(value: object | None) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _is_date(value: object | None) -> bool:
    return isinstance(value, date)


def _is_time(value: object | None) -> bool:
    return isinstance(value, time)


def _has_any_value(row: WorkbookRow, columns: tuple[str, ...]) -> bool:
    return any(row.get(column) is not None for column in columns)


def _validate_schema(data: WorkbookData, report: ValidationReport) -> set[str]:
    missing_columns: set[str] = set()
    for sheet_name, required_columns in REQUIRED_SCHEMAS.items():
        sheet = data.get_sheet(sheet_name)
        if sheet is None:
            report.add(
                "error",
                "MISSING_SHEET",
                f"Required sheet is missing: {sheet_name}",
                sheet_name,
            )
            continue

        for header in sorted(sheet.duplicate_headers):
            report.add(
                "error",
                "DUPLICATE_HEADER",
                f"Duplicate column header after trimming: {header}",
                sheet_name,
                column=header,
            )

        for column in required_columns:
            if not sheet.has_column(column):
                missing_columns.add(f"{sheet_name}.{column}")
                report.add(
                    "error",
                    "MISSING_COLUMN",
                    f"Required column is missing: {column}",
                    sheet_name,
                    column=column,
                )

    return missing_columns


def _validate_stages(
    sheet: SheetData | None,
    report: ValidationReport,
) -> tuple[dict[int, StageRecord], tuple[date, date] | None]:
    if sheet is None:
        return {}, None

    candidates: list[StageRecord] = []
    order_counts: Counter[int] = Counter()

    for row in sheet.rows:
        order_value = row.get("Stage_Order")
        city = row.get("City")
        start_value = row.get("Start_Date")
        end_value = row.get("End_Date")
        nights = row.get("Nights")

        valid_order: int | None = None
        if sheet.has_column("Stage_Order"):
            if order_value is None:
                report.add(
                    "error",
                    "MISSING_REQUIRED_VALUE",
                    "Stage_Order is required",
                    sheet.name,
                    row=row.number,
                    column="Stage_Order",
                )
            elif not _is_integer(order_value) or order_value <= 0:
                report.add(
                    "error",
                    "INVALID_STAGE_ORDER",
                    "Stage_Order must be a positive integer",
                    sheet.name,
                    row=row.number,
                    column="Stage_Order",
                )
            else:
                valid_order = order_value
                order_counts[valid_order] += 1
                if order_counts[valid_order] > 1:
                    report.add(
                        "error",
                        "DUPLICATE_STAGE_ORDER",
                        f"Duplicate Stage_Order: {valid_order}",
                        sheet.name,
                        row=row.number,
                        column="Stage_Order",
                    )

        if sheet.has_column("City") and city is None:
            report.add(
                "error",
                "MISSING_REQUIRED_VALUE",
                "City is required for a Stage",
                sheet.name,
                row=row.number,
                column="City",
            )

        valid_start = _is_date(start_value)
        valid_end = _is_date(end_value)
        if sheet.has_column("Start_Date") and not valid_start:
            report.add(
                "error",
                "INVALID_DATE",
                "Start_Date must be a valid date",
                sheet.name,
                row=row.number,
                column="Start_Date",
            )
        if sheet.has_column("End_Date") and not valid_end:
            report.add(
                "error",
                "INVALID_DATE",
                "End_Date must be a valid date",
                sheet.name,
                row=row.number,
                column="End_Date",
            )

        if nights is not None and sheet.has_column("Nights"):
            if not _is_integer(nights) or nights < 0:
                report.add(
                    "error",
                    "INVALID_NIGHTS",
                    "Nights must be a non-negative integer",
                    sheet.name,
                    row=row.number,
                    column="Nights",
                )
            elif (
                valid_start
                and valid_end
                and end_value >= start_value
                and nights != (end_value - start_value).days
            ):
                report.add(
                    "warning",
                    "NIGHTS_MISMATCH",
                    "Nights differs from the Stage date interval",
                    sheet.name,
                    row=row.number,
                    column="Nights",
                )

        if valid_start and valid_end and end_value < start_value:
            report.add(
                "error",
                "STAGE_DATE_ORDER",
                "End_Date must not be earlier than Start_Date",
                sheet.name,
                row=row.number,
                column="End_Date",
            )
        elif valid_order is not None and valid_start and valid_end:
            candidates.append(
                StageRecord(
                    order=valid_order,
                    start_date=start_value,
                    end_date=end_value,
                    row=row.number,
                )
            )

    stages = {
        stage.order: stage
        for stage in candidates
        if order_counts[stage.order] == 1
    }
    ordered_stages = sorted(stages.values(), key=lambda stage: stage.order)
    for previous, current in zip(ordered_stages, ordered_stages[1:]):
        if current.start_date < previous.end_date:
            report.add(
                "error",
                "STAGE_OVERLAP",
                f"Stage {current.order} starts before Stage {previous.order} ends",
                sheet.name,
                row=current.row,
                column="Start_Date",
            )

    if not ordered_stages:
        return stages, None
    return stages, (
        min(stage.start_date for stage in ordered_stages),
        max(stage.end_date for stage in ordered_stages),
    )


def _validate_named_entities(
    sheet: SheetData | None,
    report: ValidationReport,
    *,
    id_column: str,
    name_column: str,
    duration_column: str | None = None,
) -> set[str]:
    if sheet is None:
        return set()

    pattern = ID_PATTERNS[id_column]
    seen_ids: set[str] = set()
    valid_ids: set[str] = set()

    for row in sheet.rows:
        identifier = row.get(id_column)
        name = row.get(name_column)

        if sheet.has_column(id_column):
            if identifier is None:
                report.add(
                    "error",
                    "MISSING_REQUIRED_VALUE",
                    f"{id_column} is required",
                    sheet.name,
                    row=row.number,
                    column=id_column,
                )
            elif not isinstance(identifier, str) or not pattern.fullmatch(identifier):
                report.add(
                    "error",
                    "INVALID_ID_FORMAT",
                    f"{id_column} has an invalid format",
                    sheet.name,
                    row=row.number,
                    column=id_column,
                )
            elif identifier in seen_ids:
                report.add(
                    "error",
                    "DUPLICATE_ID",
                    f"Duplicate {id_column}: {identifier}",
                    sheet.name,
                    row=row.number,
                    column=id_column,
                )
            else:
                seen_ids.add(identifier)
                valid_ids.add(identifier)

        if sheet.has_column(name_column) and name is None:
            report.add(
                "error",
                "MISSING_REQUIRED_VALUE",
                f"{name_column} is required",
                sheet.name,
                row=row.number,
                column=name_column,
            )

        if duration_column and sheet.has_column(duration_column):
            duration = row.get(duration_column)
            if duration is not None and (
                not _is_integer(duration) or duration <= 0
            ):
                report.add(
                    "error",
                    "INVALID_DURATION",
                    f"{duration_column} must be a positive integer",
                    sheet.name,
                    row=row.number,
                    column=duration_column,
                )

    return valid_ids


def _validate_time_value(
    report: ValidationReport,
    sheet: SheetData,
    row: WorkbookRow,
    column: str,
) -> time | None:
    if not sheet.has_column(column):
        return None
    value = row.get(column)
    if value is None:
        return None
    if not _is_time(value):
        report.add(
            "error",
            "INVALID_TIME",
            f"{column} must be a valid time",
            sheet.name,
            row=row.number,
            column=column,
        )
        return None
    return value


def _validate_hotels(
    sheet: SheetData | None,
    report: ValidationReport,
    stages: dict[int, StageRecord],
    *,
    stage_registry_available: bool,
) -> None:
    if sheet is None:
        return

    hotel_stages: set[int] = set()
    for row in sheet.rows:
        order_value = row.get("Stage_Order")
        name = row.get("Hotel_Name")

        if sheet.has_column("Stage_Order"):
            if order_value is None:
                report.add(
                    "error",
                    "MISSING_REQUIRED_VALUE",
                    "Stage_Order is required for a Hotel",
                    sheet.name,
                    row=row.number,
                    column="Stage_Order",
                )
            elif not _is_integer(order_value) or order_value <= 0:
                report.add(
                    "error",
                    "INVALID_STAGE_ORDER",
                    "Hotel Stage_Order must be a positive integer",
                    sheet.name,
                    row=row.number,
                    column="Stage_Order",
                )
            else:
                if stage_registry_available and order_value not in stages:
                    report.add(
                        "error",
                        "UNKNOWN_STAGE",
                        f"Hotel refers to unknown Stage {order_value}",
                        sheet.name,
                        row=row.number,
                        column="Stage_Order",
                    )
                if order_value in hotel_stages:
                    report.add(
                        "error",
                        "DUPLICATE_HOTEL_STAGE",
                        f"Multiple Hotels refer to Stage {order_value}",
                        sheet.name,
                        row=row.number,
                        column="Stage_Order",
                    )
                hotel_stages.add(order_value)

        if sheet.has_column("Hotel_Name") and name is None:
            report.add(
                "error",
                "MISSING_REQUIRED_VALUE",
                "Hotel_Name is required",
                sheet.name,
                row=row.number,
                column="Hotel_Name",
            )

        _validate_time_value(report, sheet, row, "Checkin_Time")
        _validate_time_value(report, sheet, row, "Checkout_Time")


def _validate_transport(
    sheet: SheetData | None,
    report: ValidationReport,
    stages: dict[int, StageRecord],
    *,
    stage_registry_available: bool,
) -> tuple[set[str], bool]:
    if sheet is None:
        return set(), False

    id_registry_available = sheet.has_column("Transport_ID")
    seen_ids: set[str] = set()
    valid_ids: set[str] = set()
    entity_columns = tuple(
        column
        for column in REQUIRED_SCHEMAS["Transport"]
        if column != "Stage_Order"
    ) + ("Our Notes",)

    for row in sheet.rows:
        if not _has_any_value(row, entity_columns):
            continue

        identifier = row.get("Transport_ID")
        if id_registry_available:
            if identifier is None:
                report.add(
                    "error",
                    "MISSING_REQUIRED_VALUE",
                    "Transport_ID is required for a meaningful Transport",
                    sheet.name,
                    row=row.number,
                    column="Transport_ID",
                )
            elif not isinstance(identifier, str) or not ID_PATTERNS[
                "Transport_ID"
            ].fullmatch(identifier):
                report.add(
                    "error",
                    "INVALID_ID_FORMAT",
                    "Transport_ID has an invalid format",
                    sheet.name,
                    row=row.number,
                    column="Transport_ID",
                )
            elif identifier in seen_ids:
                report.add(
                    "error",
                    "DUPLICATE_ID",
                    f"Duplicate Transport_ID: {identifier}",
                    sheet.name,
                    row=row.number,
                    column="Transport_ID",
                )
            else:
                seen_ids.add(identifier)
                valid_ids.add(identifier)

        order_value = row.get("Stage_Order")
        valid_stage: StageRecord | None = None
        if sheet.has_column("Stage_Order"):
            if order_value is None:
                report.add(
                    "error",
                    "MISSING_REQUIRED_VALUE",
                    "Stage_Order is required for a meaningful Transport",
                    sheet.name,
                    row=row.number,
                    column="Stage_Order",
                )
            elif not _is_integer(order_value) or order_value <= 0:
                report.add(
                    "error",
                    "INVALID_STAGE_ORDER",
                    "Transport Stage_Order must be a positive integer",
                    sheet.name,
                    row=row.number,
                    column="Stage_Order",
                )
            elif stage_registry_available:
                valid_stage = stages.get(order_value)
                if valid_stage is None:
                    report.add(
                        "error",
                        "UNKNOWN_STAGE",
                        f"Transport refers to unknown Stage {order_value}",
                        sheet.name,
                        row=row.number,
                        column="Stage_Order",
                    )

        transport_date = row.get("Date")
        valid_date = _is_date(transport_date)
        if sheet.has_column("Date") and not valid_date:
            report.add(
                "error",
                "INVALID_DATE",
                "Date is required and must be a valid date",
                sheet.name,
                row=row.number,
                column="Date",
            )

        for column in ("Mode", "From", "To"):
            if sheet.has_column(column) and row.get(column) is None:
                report.add(
                    "error",
                    "MISSING_REQUIRED_VALUE",
                    f"{column} is required for a meaningful Transport",
                    sheet.name,
                    row=row.number,
                    column=column,
                )

        _validate_time_value(report, sheet, row, "Start_Time")
        _validate_time_value(report, sheet, row, "End_Time")

        if valid_date and valid_stage and transport_date != valid_stage.start_date:
            report.add(
                "error",
                "TRANSPORT_DATE_MISMATCH",
                f"Transport date does not match Stage {valid_stage.order} start date",
                sheet.name,
                row=row.number,
                column="Date",
            )

    return valid_ids, id_registry_available


def _validate_schedule(
    sheet: SheetData | None,
    report: ValidationReport,
    *,
    trip_bounds: tuple[date, date] | None,
    activity_ids: set[str],
    food_ids: set[str],
    transport_ids: set[str],
    transport_registry_available: bool,
) -> None:
    if sheet is None:
        return

    registries = {
        "ACT": activity_ids,
        "FOD": food_ids,
        "TRA": transport_ids,
    }

    for row in sheet.rows:
        schedule_date = row.get("Date")
        valid_date = _is_date(schedule_date)
        if sheet.has_column("Date") and not valid_date:
            report.add(
                "error",
                "INVALID_DATE",
                "Date is required and must be a valid date",
                sheet.name,
                row=row.number,
                column="Date",
            )
        elif valid_date and trip_bounds and not (
            trip_bounds[0] <= schedule_date <= trip_bounds[1]
        ):
            report.add(
                "error",
                "SCHEDULE_DATE_OUT_OF_RANGE",
                "Schedule Date falls outside the trip period",
                sheet.name,
                row=row.number,
                column="Date",
            )

        if sheet.has_column("Type") and row.get("Type") is None:
            report.add(
                "error",
                "MISSING_REQUIRED_VALUE",
                "Type is required for a Schedule entry",
                sheet.name,
                row=row.number,
                column="Type",
            )

        start_time = _validate_time_value(report, sheet, row, "Start_Time")
        end_time = _validate_time_value(report, sheet, row, "End_Time")
        if start_time and end_time and end_time < start_time:
            report.add(
                "error",
                "TIME_ORDER",
                "End_Time must not be earlier than Start_Time",
                sheet.name,
                row=row.number,
                column="End_Time",
            )

        duration = row.get("Duration_Min")
        valid_duration = duration is None or (
            _is_integer(duration) and duration > 0
        )
        if sheet.has_column("Duration_Min") and not valid_duration:
            report.add(
                "error",
                "INVALID_DURATION",
                "Duration_Min must be a positive integer",
                sheet.name,
                row=row.number,
                column="Duration_Min",
            )
        elif (
            duration is not None
            and start_time
            and end_time
            and end_time >= start_time
        ):
            interval = (
                end_time.hour * 60
                + end_time.minute
                - start_time.hour * 60
                - start_time.minute
            )
            tolerance = max(15, round(interval * 0.25))
            if abs(duration - interval) > tolerance:
                report.add(
                    "warning",
                    "DURATION_MISMATCH",
                    "Duration_Min differs substantially from the time interval",
                    sheet.name,
                    row=row.number,
                    column="Duration_Min",
                )

        reference = row.get("Reference")
        if reference is None or not sheet.has_column("Reference"):
            continue
        if not isinstance(reference, str):
            report.add(
                "error",
                "UNKNOWN_REFERENCE_PREFIX",
                "Reference must use an ACT, FOD, or TRA identifier",
                sheet.name,
                row=row.number,
                column="Reference",
            )
            continue

        prefix = reference[:3]
        if prefix not in registries:
            report.add(
                "error",
                "UNKNOWN_REFERENCE_PREFIX",
                "Reference must use an ACT, FOD, or TRA prefix",
                sheet.name,
                row=row.number,
                column="Reference",
            )
        elif prefix == "TRA" and not transport_registry_available:
            continue
        elif reference not in registries[prefix]:
            report.add(
                "error",
                "BROKEN_REFERENCE",
                f"Reference does not resolve to an existing {prefix} entity",
                sheet.name,
                row=row.number,
                column="Reference",
            )


def validate_data(data: WorkbookData) -> ValidationReport:
    """Validate already-read workbook data and return all useful diagnostics."""

    report = ValidationReport(workbook=data.path)
    missing_columns = _validate_schema(data, report)

    stages, trip_bounds = _validate_stages(data.get_sheet("Stages"), report)
    stage_registry_available = (
        data.get_sheet("Stages") is not None
        and "Stages.Stage_Order" not in missing_columns
        and "Stages.Start_Date" not in missing_columns
        and "Stages.End_Date" not in missing_columns
    )

    activity_ids = _validate_named_entities(
        data.get_sheet("Activities"),
        report,
        id_column="Activity_ID",
        name_column="Activity_Name",
        duration_column="Duration_Min",
    )
    food_ids = _validate_named_entities(
        data.get_sheet("Food"),
        report,
        id_column="Food_ID",
        name_column="Food_Name",
    )
    _validate_hotels(
        data.get_sheet("Hotels"),
        report,
        stages,
        stage_registry_available=stage_registry_available,
    )
    transport_ids, transport_registry_available = _validate_transport(
        data.get_sheet("Transport"),
        report,
        stages,
        stage_registry_available=stage_registry_available,
    )
    _validate_schedule(
        data.get_sheet("Schedule"),
        report,
        trip_bounds=trip_bounds,
        activity_ids=activity_ids,
        food_ids=food_ids,
        transport_ids=transport_ids,
        transport_registry_available=transport_registry_available,
    )
    return report


def validate_workbook(path: str | Path) -> ValidationReport:
    """Read and validate a workbook without modifying it."""

    return validate_data(read_workbook(path))
