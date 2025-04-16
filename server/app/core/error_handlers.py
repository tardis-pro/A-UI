import logging
from typing import Callable, Dict, Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .exceptions import APIException, ErrorResponseModel

logger = logging.getLogger(__name__)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle validation exceptions from Pydantic models and return standardized error format
    """
    errors = {}
    for error in exc.errors():
        loc = ".".join(str(l) for l in error["loc"] if l != "body")
        if loc not in errors:
            errors[loc] = []
        errors[loc].append(error["msg"])
    
    logger.warning(f"Validation error: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponseModel(
            code="VALIDATION_ERROR",
            message="Validation error",
            details={"errors": errors}
        ).dict(),
    )


async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """
    Handle API exceptions and return standardized error format
    """
    if exc.status_code >= 500:
        logger.error(f"API error: {exc.code} - {exc.detail}", exc_info=True)
    else:
        logger.warning(f"API error: {exc.code} - {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
        headers=exc.headers,
    )


async def internal_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions and return standardized error format
    """
    logger.exception(f"Unexpected error: {str(exc)}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponseModel(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
            details={"error": str(exc)} if not isinstance(exc, Exception) else None
        ).dict(),
    )


def setup_error_handlers(app: FastAPI) -> None:
    """
    Configure global exception handlers for the FastAPI application
    """
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(APIException, api_exception_handler)
    app.add_exception_handler(Exception, internal_exception_handler) 