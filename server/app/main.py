import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.error_handlers import setup_error_handlers
from app.core.monitoring import setup_monitoring
from app.core.websocket import setup_websocket
from app.core.sse import setup_sse
from app.routes import progress, api, knowledge, auth, chat, code
from app.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI backend for A-UI multi-agent discussion arena",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

# Configure CORS
# Security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])  # Configure for production
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up error handlers
setup_error_handlers(app)

# Set up monitoring
setup_monitoring(app)

# Set up WebSocket
setup_websocket(app)

# Set up Server-Sent Events
setup_sse(app)

# Include API routes
# Include routers
app.include_router(auth.router)
app.include_router(progress.router)
app.include_router(api.router)
app.include_router(knowledge.router)
app.include_router(chat.router)
# Command History routes
# from app.routes import command_history
# app.include_router(command_history.router)

# Custom OpenAPI documentation
@app.get("/docs", response_class=HTMLResponse)
async def get_swagger_documentation():
    """Custom Swagger UI"""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Swagger UI",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css",
    )

@app.get("/redoc", response_class=HTMLResponse)
async def get_redoc_documentation():
    """Custom ReDoc UI"""
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - ReDoc",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
    )

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "A-UI API"} 