@echo off
echo ========================================
echo INK.SPIRIT Blog
echo Starting Development Services
echo ========================================
echo.

echo [1/5] Starting PostgreSQL...
docker-compose up -d db

echo [2/5] Starting Redis (optional)...
docker-compose up -d redis

echo [3/5] Starting Python AI Service...
cd ai-service
if exist .env (
    echo .env found
) else (
    echo Creating .env from .env.example
    copy .env.example .env
)
echo.
echo Starting AI Service on http://localhost:8000
start /B cmd /C uvicorn main:app --reload --host 0.0.0.0 --port 8000
cd ..

echo [4/5] Starting Node.js Backend...
cd backend
if exist .env (
    echo .env found
) else (
    echo Creating .env from .env.example
    copy .env.example .env
)
echo.
echo Starting Backend on http://localhost:3001
start /B cmd /C npm run dev
cd ..

echo [5/5] Starting React Frontend...
cd frontend
start /B cmd /C npm run dev
cd ..

echo.
echo ========================================
echo All services started!
echo.
echo Access points:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo   AI Service: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Prisma Studio: npx prisma studio (from backend/)
echo.
echo Press Ctrl+C to stop all services
echo ========================================
