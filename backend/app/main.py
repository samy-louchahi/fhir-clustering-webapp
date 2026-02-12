from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import redis
import logging

from app.api import clustering, llm

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager"""
    logger.info("Starting FHIR Clustering API...")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="FHIR Clustering API",
    description="API for clustering FHIR patient data with LLM-generated reports",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(clustering.router, prefix="/api/clustering", tags=["clustering"])
app.include_router(llm.router, prefix="/api/llm", tags=["llm"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis
        r = redis.Redis(host='redis', port=6379, decode_responses=True)
        r.ping()
        redis_status = "healthy"
    except:
        redis_status = "unhealthy"
    
    return {
        "status": "healthy",
        "redis": redis_status
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FHIR Clustering API",
        "docs": "/docs",
        "health": "/health"
    }
