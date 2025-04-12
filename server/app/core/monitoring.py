import time
from typing import Callable
from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Define metrics
REQUEST_COUNT = Counter(
    "api_request_count", 
    "Count of API requests received",
    ["method", "endpoint", "status_code"]
)

REQUEST_LATENCY = Histogram(
    "api_request_latency_seconds", 
    "API request latency in seconds",
    ["method", "endpoint"]
)

EXCEPTION_COUNT = Counter(
    "api_exception_count", 
    "Count of exceptions raised during API requests",
    ["method", "endpoint", "exception_type"]
)


async def metrics_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware to collect request metrics
    """
    start_time = time.time()
    method = request.method
    endpoint = request.url.path
    
    try:
        response = await call_next(request)
        status_code = response.status_code
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
        return response
    except Exception as e:
        EXCEPTION_COUNT.labels(
            method=method, 
            endpoint=endpoint, 
            exception_type=type(e).__name__
        ).inc()
        raise
    finally:
        end_time = time.time()
        REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(end_time - start_time)


async def metrics_endpoint() -> Response:
    """
    Endpoint to expose Prometheus metrics
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


def setup_monitoring(app: FastAPI) -> None:
    """
    Configure monitoring for the FastAPI application
    """
    # Add metrics middleware
    app.middleware("http")(metrics_middleware)
    
    # Add metrics endpoint
    app.add_route("/metrics", metrics_endpoint, methods=["GET"]) 