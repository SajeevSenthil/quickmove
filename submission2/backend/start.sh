#!/bin/bash
# Render startup script — seeds DB then starts the API server
set -e

echo "Running database migrations..."
python seed_data.py

echo "Starting API server..."
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
