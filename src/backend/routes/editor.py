from pickle import SHORT_BINBYTES
from typing import Optional
from fastapi import APIRouter
from fastapi import Query
from pandas.core.arraylike import default_array_ufunc
from pydantic.main import BaseModel

from api.dependencies import ApiSession
from api.serialize import OcelEvent, events_to_api
from editor.dataframe import paginated_dataframe
from editor.model.api import PaginatedResponse
from editor.ocel import EventFilter, apply_event_filter
from editor.util.overview import OCELSummary, get_ocel_information


router = APIRouter(prefix="/editor", tags=["editor"])


class QueryParams(BaseModel):
    page: int = 1
    size: int = 10
    sort_by: Optional[str] = None


@router.post(
    "/events", summary="Filtered Events", response_model=PaginatedResponse[OcelEvent]
)
def events(
    session: ApiSession,
    filter: EventFilter,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    sort_by: Optional[str] = None,
) -> PaginatedResponse[OcelEvent]:
    ocel = session.ocel.ocel

    events = apply_event_filter(ocel, filter)
    print(events)

    paginated_events = paginated_dataframe(
        events,
        page,
        size,
        None,
        lambda df: events_to_api(
            df, include_empty_attrs=True, include_empty_values=True
        ),
    )
    paginated_events.data

    return PaginatedResponse[OcelEvent](
        data=paginated_events.data,
        totalPages=paginated_events.total_pages,
        page=paginated_events.page,
    )


@router.post("/info", summary="Filtered Events", response_model=OCELSummary)
def info(session: ApiSession, filter: EventFilter) -> OCELSummary:
    return get_ocel_information(session.ocel.ocel)
