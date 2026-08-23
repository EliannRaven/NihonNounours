# NihonNounours

NihonNounours is a smartphone-first static travel companion for a Japan trip in
September and October 2026.

## Technical stack

- Vite
- React
- TypeScript
- React Router
- CSS
- Vitest and React Testing Library

## Current status

The project currently provides only the technical frontend foundation: the
application shell, initial routes, responsive global styles, and test/lint/build
tooling. Travel features and travel data are not implemented yet.

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a type-checked production build:

```bash
npm run build
```

Run the smoke test:

```bash
npm run test
```

Run ESLint:

```bash
npm run lint
```

## Python data validation

Install the Python runtime and development dependencies:

```bash
python -m pip install -r requirements-dev.txt
```

Validate the editable Excel source of truth:

```bash
python -m scripts.validate_trip_data
```

Run the Python test suite:

```bash
python -m pytest
```

Validation errors prevent the future data build from running safely. Warnings
identify incomplete or suspicious data that remains usable but deserves
attention. The current workbook may intentionally fail validation until its
known data issues have been corrected.

## Directory structure

```text
data/               Authoring data retained outside the frontend build
src/
  components/       Small reusable layout components
  pages/            Route-level page components
  styles/           Global styling foundation
  App.tsx            Application root
  main.tsx           Browser entry point
scripts/
  trip_data/         Reusable Excel reader and validation rules
  validate_trip_data.py
tests/python/        Python validation tests
```

## Data architecture

`data/InputData_v2.xlsx` is the authoring source for future application data.
The intended flow is:

```text
Excel
→ Python preprocessing and validation
→ normalized JSON
→ React frontend
→ static build
```

React must never parse the Excel file directly in production. The preprocessing
and validation pipeline will be implemented in a later task.
