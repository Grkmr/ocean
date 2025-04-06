from fastapi import APIRouter

from api.dependencies import ApiSession


router = APIRouter(prefix="/editor", tags=["editor"])


@router.get("/events", summary="Filtered Events")
def events(session: ApiSession):
    return {"message": "test"}
