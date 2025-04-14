from typing import Any, Dict, Optional
from fastapi import APIRouter
from fastapi import Query
from fastapi.exceptions import HTTPException
import pm4py
from pydantic.main import BaseModel

from api.dependencies import ApiOcel, ApiSession
from api.model.response import OcelResponse
from api.serialize import OcelEvent, events_to_api, ocel_to_api
from editor.dataframe import paginated_dataframe
from editor.model.api import PaginatedResponse
from editor.model.filter import EventFilter
from editor.util.filter.events import apply_event_filter
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
    return get_ocel_information(
        pm4py.filter_ocel_events(
            session.ocel.ocel,
            list(apply_event_filter(session.ocel.ocel, filter)["ocel:eid"]),
        )
    )


class UpsertAttributesRequest(BaseModel):
    new_attributes: Dict[str, Any]


@router.post("/api/ocel/{otype}/upsert_attributes")
def upsert_object_attributes(
    otype: str, req: UpsertAttributesRequest, ocel: ApiOcel, session: ApiSession
) -> OcelResponse:
    # Check if otype exists
    if otype not in ocel.object_types:
        raise HTTPException(status_code=404, detail=f"Object type {otype} not found.")

    # Select relevant objects
    objects = ocel.objects
    objects_of_type = objects[objects["ocel:type"] == otype].copy()

    if objects_of_type.empty:
        raise HTTPException(
            status_code=404, detail=f"No objects of type {otype} found."
        )

    # Create DataFrame with new attributes
    ext_table = objects_of_type[["ocel:oid"]].copy()
    for col, val in req.new_attributes.items():
        ext_table[col] = val

    print(ext_table)
    print(req.new_attributes.keys())
    # Upsert using your wrapper method
    ocel.upsert_attributes(
        ext_table=ext_table,  # type: ignore
        table="objects",
        merge_fields=[("ocel:oid", "ocel:oid")],
        added_columns=[(col, col) for col in req.new_attributes.keys()],
        replace=True,
    )

    print(ocel.ocel.objects)
    return OcelResponse(
        **session.respond(
            route="load",
            msg=f'Event log "{ocel.meta["fileName"] or session.id}" has been updated.',
            ocel=ocel_to_api(ocel, session=session),
            emissions=session.emission_model.emissions,
        )
    )


@router.post("/api/ocel/{otype}/test_upsert")
def upsert_object_attributes(
    otype: str, req: UpsertAttributesRequest, ocel: ApiOcel, session: ApiSession
) -> OcelResponse:
    # Check if otype exists
    if otype not in ocel.object_types:
        raise HTTPException(status_code=404, detail=f"Object type {otype} not found.")

    # Select relevant objects
    objects = ocel.objects
    objects_of_type = objects[objects["ocel:type"] == otype].copy()

    if objects_of_type.empty:
        raise HTTPException(
            status_code=404, detail=f"No objects of type {otype} found."
        )

    # Create DataFrame with new attributes
    ext_table = objects_of_type[["ocel:oid"]].copy()
    for col, val in req.new_attributes.items():
        ext_table[col] = val

    print(ext_table)
    print(req.new_attributes.keys())
    # Upsert using your wrapper method
    ocel.upsert_attributes(
        ext_table=ext_table,  # type: ignore
        table="objects",
        merge_fields=[("ocel:oid", "ocel:oid")],
        added_columns=[(col, col) for col in req.new_attributes.keys()],
        replace=True,
    )

    print(ocel.ocel.objects)
    return OcelResponse(
        **session.respond(
            route="load",
            msg=f'Event log "{ocel.meta["fileName"] or session.id}" has been updated.',
            ocel=ocel_to_api(ocel, session=session),
            emissions=session.emission_model.emissions,
        )
    )
