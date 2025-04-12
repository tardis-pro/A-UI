from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from pydantic import BaseModel


class ErrorResponseModel(BaseModel):
    """Standardized error response model"""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class APIException(HTTPException):
    """Base exception class for API errors"""
    
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.details = details
        super().__init__(status_code=status_code, detail={
            "code": code,
            "message": message,
            "details": details
        }, headers=headers)


class BadRequestException(APIException):
    """400 Bad Request"""
    
    def __init__(
        self,
        code: str = "BAD_REQUEST",
        message: str = "Bad request",
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code=code,
            message=message,
            details=details,
            headers=headers,
        )


class UnauthorizedException(APIException):
    """401 Unauthorized"""
    
    def __init__(
        self,
        code: str = "UNAUTHORIZED",
        message: str = "Authentication required",
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            message=message,
            details=details,
            headers=headers,
        )


class ForbiddenException(APIException):
    """403 Forbidden"""
    
    def __init__(
        self,
        code: str = "FORBIDDEN",
        message: str = "Access denied",
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code=code,
            message=message,
            details=details,
            headers=headers,
        )


class NotFoundException(APIException):
    """404 Not Found"""
    
    def __init__(
        self,
        code: str = "NOT_FOUND",
        message: str = "Resource not found",
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code=code,
            message=message,
            details=details,
            headers=headers,
        )


class ConflictException(APIException):
    """409 Conflict"""
    
    def __init__(
        self,
        code: str = "CONFLICT",
        message: str = "Resource conflict",
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code=code,
            message=message,
            details=details,
            headers=headers,
        )


class ServerException(APIException):
    """500 Internal Server Error"""
    
    def __init__(
        self,
        code: str = "INTERNAL_SERVER_ERROR",
        message: str = "Internal server error",
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code=code,
            message=message,
            details=details,
            headers=headers,
        )


class ServiceUnavailableException(APIException):
    """503 Service Unavailable"""
    
    def __init__(
        self,
        code: str = "SERVICE_UNAVAILABLE",
        message: str = "Service temporarily unavailable",
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code=code,
            message=message,
            details=details,
            headers=headers,
        ) 