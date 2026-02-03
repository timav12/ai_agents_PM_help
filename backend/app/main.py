"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.config import settings
from app.database import init_db
from app.api import projects_router, chat_router, artifacts_router, communications_router, stats_router, agents_router, auth_router, admin_router

# Configure loguru
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.DEBUG else "INFO",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting AI Agents MVP...")
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Agents MVP...")


# Create FastAPI app
app = FastAPI(
    title="AI Agents MVP",
    description="AI Agents for Product Development",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
# In production, requests come through nginx proxy, so we allow the same origin
# For development, we also allow localhost
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
]

# In production (Docker), allow all origins since nginx handles this
if not settings.DEBUG:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(artifacts_router, prefix="/api")
app.include_router(communications_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "AI Agents MVP",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
