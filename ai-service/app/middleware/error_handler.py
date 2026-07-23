"""
Custom middleware for AI Service
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from time import time
import json


class LoggingMiddleware(BaseHTTPMiddleware):
    """Request/response logging middleware"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time()
        
        # Log request
        print(f"[{start_time}] {request.method} {request.url.path}")
        
        response = await call_next(request)
        
        # Calculate duration
        process_time = (time() - start_time) * 1000
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log response
        print(f"[{start_time}] {request.method} {request.url.path} - {response.status_code} - {process_time:.2f}ms")
        
        return response


class ErrorLoggingMiddleware:
    """Detailed error logging middleware"""
    
    async def __call__(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            print(f"Error: {str(e)}", exc_info=True)
            raise


def register_exception_handlers(app):
    """Register global exception handlers"""
    
    from fastapi import Request, status
    from fastapi.responses import JSONResponse
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handle all unhandled exceptions"""
        import logging
        logger = logging.getLogger("ai-service")
        logger.exception(f"Unhandled exception: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "message": str(exc),
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        """Handle validation errors"""
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation error",
                "message": str(exc)
            }
        )
    
    @app.exception_handler(KeyError)
    async def key_error_handler(request: Request, exc: KeyError):
        """Handle missing data errors"""
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error": "Resource not found",
                "message": f"Missing: {str(exc)}"
            }
        )
