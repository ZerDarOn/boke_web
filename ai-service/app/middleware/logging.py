"""
Request logging middleware
"""

import time
import logging
from fastapi import Request

logger = logging.getLogger("ai-service")


class LoggingMiddleware:
    """Log incoming requests with duration"""

    async def __call__(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        logger.info(
            f"{request.method} {request.url.path} → {response.status_code} ({duration:.3f}s)"
        )
        return response
