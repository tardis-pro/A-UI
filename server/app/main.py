from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from app.core.error_handlers import setup_error_handlers
from app.core.monitoring import setup_monitoring
from app.core.websocket import setup_websocket
from app.core.sse import setup_sse
from app.routes import progress, api, knowledge

app = FastAPI(
    title="A-UI API",
    description="FastAPI backend for A-UI multi-agent discussion arena",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure this properly for production
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
app.include_router(progress.router)
app.include_router(api.router)
app.include_router(knowledge.router)

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