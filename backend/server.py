from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from supabase_client import init_supabase

# Import route modules
from routes import auth, members, plans, attendance, payments, settings, reports


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="Gym Management System API", version="1.0.0")

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

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()