# NihonNounours

NihonNounours is a smartphone-first static travel companion for the Japan 2026
trip. Its MVP combines the daily journey, the overall itinerary, and authored
Activity and Food discovery in one mobile-focused React application.

## Technical stack

- Vite
- React
- TypeScript
- React Router
- CSS
- Vitest and React Testing Library

## MVP status

The MVP is feature-complete before deployment.

Implemented:

- Excel validation and normalized JSON build pipeline
- Typed React data layer
- Today journey view
- Trip overview
- Explore Activities and Explore Food
- Shared Activity, Food, Hotel, and Transport detail sheets
- Smartphone-first navigation

Deferred until after the production MVP is deployed and tested:

- Map
- Trip Info
- PWA and offline support
- Live weather

Deployment is not configured yet.

## MVP routes

- `/today` — daily journey, timeline, NOW, NEXT, and flexible discovery
- `/trip` — complete journey and stage overview
- `/explore` — Activities and Food catalogues

The deferred `/map` and `/info` routes currently redirect to `/today`.

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

Run the frontend test suite:

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
suspicious data that remains usable and do not block generation.
`src/data/trip.json` is generated from `data/InputData_v2.xlsx` and must not be
edited manually.

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

`data/InputData_v2.xlsx` is the application authoring source. The production
data flow is:

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
