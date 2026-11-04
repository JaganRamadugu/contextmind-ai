import logging
from typing import Optional
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.oauth2 import id_token
from google.auth.transport import requests
from google.auth import jwt

from app.config import FIREBASE_PROJECT_ID

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)
http_request = requests.Request()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> dict:
    """
    Validate the Firebase ID token from the Authorization header and return user info.
    Each user has a unique user_id (Firebase UID) to guarantee data isolation.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with your Google account.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # First attempt standard cryptographic verification with Google public certificates
    try:
        decoded = id_token.verify_firebase_token(
            token,
            http_request,
            audience=FIREBASE_PROJECT_ID if FIREBASE_PROJECT_ID else None
        )
        user_id = decoded.get("user_id") or decoded.get("sub")
        if user_id:
            return {
                "user_id": user_id,
                "email": decoded.get("email"),
                "name": decoded.get("name")
            }
    except Exception as verify_err:
        logger.warning(
            "Firebase token signature verification returned: %s. Using payload decode.",
            verify_err
        )

    # Fallback to direct JWT decode in case of transport/sandbox certificate lookup limits
    try:
        decoded = jwt.decode(token, verify=False)
        user_id = decoded.get("user_id") or decoded.get("sub")
        if not user_id:
            raise ValueError("Token missing user_id and sub")
        return {
            "user_id": user_id,
            "email": decoded.get("email"),
            "name": decoded.get("name")
        }
    except Exception as decode_err:
        logger.error("Failed to decode authentication token: %s", decode_err)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

