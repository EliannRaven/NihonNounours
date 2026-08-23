"""Validate the Excel source and build normalized frontend trip JSON."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

from scripts.trip_data.builder import build_trip_data, write_trip_data
from scripts.trip_data.validation import ValidationIssue, validate_data
from scripts.trip_data.workbook import read_workbook


DEFAULT_INPUT = Path("data/InputData_v2.xlsx")
DEFAULT_OUTPUT = Path("src/data/trip.json")


def _print_issues(title: str, issues: list[ValidationIssue]) -> None:
    if not issues:
        return
    print(title)
    for issue in issues:
        location = issue.sheet
        if issue.row is not None:
            location += f" row {issue.row}"
        if issue.column is not None:
            location += f", {issue.column}"
        print(f"  [{location}] {issue.code}: {issue.message}")
    print()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate Excel and build normalized NihonNounours trip JSON."
    )
    parser.add_argument(
        "workbook",
        nargs="?",
        type=Path,
        default=DEFAULT_INPUT,
        help=f"Workbook path (default: {DEFAULT_INPUT.as_posix()})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"JSON output path (default: {DEFAULT_OUTPUT.as_posix()})",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    print("NihonNounours trip data build")
    print()
    print(f"Workbook: {args.workbook}")
    print(f"Output: {args.output}")
    print()

    try:
        data = read_workbook(args.workbook)
        report = validate_data(data)
        _print_issues("ERRORS", report.errors)
        _print_issues("WARNINGS", report.warnings)
        if report.error_count:
            print(
                "Build blocked by validation: "
                f"{report.error_count} error(s), {report.warning_count} warning(s)"
            )
            return 1

        trip_data = build_trip_data(data)
        write_trip_data(trip_data, args.output)
    except Exception as exc:
        print(f"Build could not run: {type(exc).__name__}", file=sys.stderr)
        return 2

    print(
        f"Generated {args.output}: "
        f"0 errors, {report.warning_count} warning(s)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
