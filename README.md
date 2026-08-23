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

The project currently provides the technical frontend foundation plus the
Python validation and normalized-data build pipeline. React does not consume
the generated trip data yet, and the travel features are not implemented.

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

Validate and build the normalized frontend data:

```bash
python -m scripts.build_trip_data
```

Run the Python test suite:

```bash
python -m pytest
```

Validation errors prevent JSON generation. Warnings identify incomplete or
suspicious data that remains usable and do not block generation. The current
workbook may intentionally fail validation until its known data issues have
been corrected, so a production `src/data/trip.json` may not exist yet.

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
  trip_data/         Reusable reader, validation, and builder modules
  build_trip_data.py
  validate_trip_data.py
tests/python/        Python validation and builder tests
```

## Data architecture

`data/InputData_v2.xlsx` is the authoring source for future application data.
The intended flow is:

```text
Excel
→ validation
→ normalized JSON
→ React frontend
→ static build
```

React must never parse the Excel file directly in production. The builder maps
validated workbook data explicitly into the frontend application model and
never emits raw worksheet rows. `Booking_Link` is intentionally excluded from
generated frontend JSON because it may contain private reservation parameters.
