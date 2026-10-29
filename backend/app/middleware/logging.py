import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.middleware.logging")

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    HTTP middleware to trace, measure, and log all incoming API requests
    and inject process-time headers for frontend tracking.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Capture request parameters
        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"
        
        # Log request receipt
        logger.info(f"Incoming: {method} {path} from {client_host}")
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            process_time_ms = (time.time() - start_time) * 1000
            logger.error(f"Request failed: {method} {path} - Error: {e} (Duration: {process_time_ms:.2f}ms)")
            raise e
            
        process_time_ms = (time.time() - start_time) * 1000
        
        # Log completion
        logger.info(
            f"Completed: {method} {path} - Status: {response.status_code} "
            f"(Duration: {process_time_ms:.2f}ms)"
        )
        
        # Inject custom processing headers
        response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"
        
        return response
