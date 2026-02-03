"""API routes."""
from app.api.projects import router as projects_router
from app.api.chat import router as chat_router
from app.api.artifacts import router as artifacts_router
from app.api.communications import router as communications_router
from app.api.stats import router as stats_router
from app.api.agents import router as agents_router
from app.api.auth_routes import router as auth_router
from app.api.admin import router as admin_router

__all__ = ["projects_router", "chat_router", "artifacts_router", "communications_router", "stats_router", "agents_router", "auth_router", "admin_router"]
