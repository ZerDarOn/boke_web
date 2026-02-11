#!/bin/bash

echo "========================================"
echo "INK.SPIRIT Blog"
echo "Starting Development Services"
echo "========================================"
echo

echo "[1/5] Starting PostgreSQL..."
docker-compose up -d db

echo "[2/5] Starting Redis (optional)..."
docker-compose up -d redis

echo "[3/5] Starting Python AI Service..."
cd ai-service
if [ ! -f .env ]; then
    echo "Creating .env from .env.example"
    cp .env.example .env
fi
echo "Starting AI Service on http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
cd ..

echo "[4/5] Starting Node.js Backend..."
cd backend
if [ ! -f .env ]; then
    echo "Creating .env from .env.example"
    cp .env.example .env
fi
echo "Starting Backend on http://localhost:3001"
npm run dev &
cd ..

echo "[5/5] Starting React Frontend..."
cd frontend
npm run dev &
cd ..

echo
echo "========================================"
echo "All services started!"
echo
echo
echo "Access points:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  AI Service: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "  Prisma Studio: npx prisma studio (from backend/)"
echo
echo
echo "Press Ctrl+C to stop all services"
echo "========================================"

# Handle Ctrl+C
trap 'kill $(jobs -p)' SIGINT
wait
