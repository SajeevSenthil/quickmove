from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import customers, brokers, assignments
from .config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QuickMove — AI Broker Allocation",
    description="Automates broker discovery, AI-powered matching, and assignment approval for QuickMove relocation operations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router)
app.include_router(brokers.router)
app.include_router(assignments.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "QuickMove AI Broker Allocation API v1.0"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}
