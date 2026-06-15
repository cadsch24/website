# LeadHive — Agent Conventions

## Backend (Python FastAPI)
- Async everywhere (async def endpoints, async db sessions)
- Use SQLAlchemy async + Alembic for migrations
- All API responses in consistent JSON format: `{"status": "ok", "data": ...}`
- Service layer pattern: routes thin, logic in services/
- Env vars via pydantic-settings
- Pytest for testing

## Frontend (React + Vite + Tailwind)
- Functional components with hooks
- Tailwind for styling (no CSS modules)
- React Router for navigation
- Axios for API calls
- Vitest + React Testing Library for tests

## API Conventions
- RESTful endpoints under `/api/v1/`
- Auth via API key (header-based)
- Pagination: `?page=1&per_page=20`
- Errors: `{"status": "error", "detail": "message"}

## Database
- Model files in backend/models/
- Migrations in backend/alembic/
- Use async SQLAlchemy session
- All tables have: id (UUID), created_at, updated_at