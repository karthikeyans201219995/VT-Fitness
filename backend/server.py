from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from supabase_client import init_supabase

# Import route modules
from routes import auth, members, plans, attendance, payments, settings, reports, trainers, qr_attendance, balance, invoices, installments


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="Gym Management System API", version="1.0.0")

# Add CORS middleware FIRST (before routes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://gymopspro.preview.emergentagent.com",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check route
@api_router.get("/")
async def root():
    return {
        "message": "Gym Management System API",
        "version": "1.0.0",
        "status": "running"
    }

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(members.router)
api_router.include_router(plans.router)
api_router.include_router(attendance.router)
api_router.include_router(payments.router)
api_router.include_router(settings.router)
api_router.include_router(reports.router)
api_router.include_router(trainers.router)
api_router.include_router(qr_attendance.router)
api_router.include_router(balance.router)
api_router.include_router(invoices.router)
api_router.include_router(installments.router)

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Supabase on startup
@app.on_event("startup")
async def startup_event():
    """Initialize Supabase client on startup"""
    supabase = init_supabase()
    if supabase:
        logger.info("Supabase initialized successfully")
    else:
        logger.warning("Supabase not initialized - credentials may not be configured")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Application shutting down")