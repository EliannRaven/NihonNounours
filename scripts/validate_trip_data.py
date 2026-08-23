"""Command-line entry point for validating the trip data workbook."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

from scripts.trip_data.validation import ValidationIssue, validate_workbook
from scripts.trip_data.workbook import WorkbookReadError


DEFAULT_WORKBOOK = Path("data/InputData_v2.xlsx")


def _format_location(issue: ValidationIssue) -> str:
    location = issue.sheet
    if issue.row is not None:
        location += f" row {issue.row}"
    if issue.column is not None:
        location += f", {issue.column}"
    return f"[{location}]"


def _print_group(title: str, issues: list[ValidationIssue]) -> None:
    print(title)
    if not issues:
        print("  None")
    else:
        for issue in issues:
            print(f"  {_format_location(issue)} {issue.code}: {issue.message}")
    print()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Safely validate the NihonNounours Excel source data."
    )
    parser.add_argument(
        "workbook",
        nargs="?",
        type=Path,
        default=DEFAULT_WORKBOOK,
        help=f"Workbook path (default: {DEFAULT_WORKBOOK.as_posix()})",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    print("NihonNounours data validation")
    print()
    print(f"Workbook: {args.workbook}")
    print()

    try:
        report = validate_workbook(args.workbook)
    except WorkbookReadError as exc:
        print(f"Validation could not run: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        print(
            f"Validation could not run: {type(exc).__name__}",
            file=sys.stderr,
        )
        return 2

    _print_group("ERRORS", report.errors)
    _print_group("WARNINGS", report.warnings)

    if report.error_count:
        print(
            "Validation failed: "
            f"{report.error_count} error(s), {report.warning_count} warning(s)"
        )
        return 1

    print(
        "Validation passed: "
        f"0 errors, {report.warning_count} warning(s)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
