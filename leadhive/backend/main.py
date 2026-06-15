from fastapi import FastAPI
from backend.api import leads, conversations, bookings, content, dashboard

app = FastAPI(
    title="LeadHive API",
    description="AI-powered lead-to-booking assistant for local service businesses.",
    version="0.1.0"
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

app.include_router(leads.router, prefix="/api/v1/leads", tags=["leads"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["bookings"])
app.include_router(content.router, prefix="/api/v1/content", tags=["content"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
