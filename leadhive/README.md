# LeadHive

An AI-powered assistant that owns the full lead-to-booking pipeline for local service businesses — capturing every missed call, instantly following up via SMS, qualifying and nurturing leads, auto-booking appointments, and generating local-market content to attract new customers.

## Stack
- **Backend**: Python FastAPI (async)
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL (SQLite for dev)
- **SMS**: Twilio
- **Calendar**: Google Calendar API
- **AI**: OpenAI API

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure
```
leadhive/
├── backend/       # Python FastAPI app
│   ├── api/       # Route handlers
│   ├── services/  # Business logic
│   ├── models/    # Database models
│   └── tests/
├── frontend/      # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   └── tests/
└── shared/        # Shared types, docs
```