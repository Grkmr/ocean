from typing import Any, Dict, List, Literal, Optional, Tuple
from fastapi import APIRouter
from fastapi import Query
from fastapi.exceptions import HTTPException
from pandas.core.frame import DataFrame
import pm4py
from pydantic.fields import Field
from pydantic.main import BaseModel

from api.dependencies import ApiOcel, ApiSession
from api.model.response import OcelResponse
from api.serialize import OcelEvent, events_to_api, ocel_to_api
from editor.dataframe import paginated_dataframe
from editor.model.api import PaginatedResponse
from editor.model.edit import O2ORule
from editor.model.filter import EventFilter
from editor.util.edit.attributes import upsert_attributes
from editor.util.edit.events import distribute
from editor.util.edit.o2o import apply_o2o_rule
from editor.util.edit.objects import upsert_objects
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
    return get_ocel_information(session.ocel.ocel)


class UpsertAttributesRequest(BaseModel):
    ext_table: List[Dict[str, Any]]
    table: Literal["objects", "events"]
    merge_fields: List[Tuple[str, str]]
    added_columns: List[Tuple[str, str]]
    replace: bool = True


@router.post("/ocel/upsert-attributes")
def upsert_attributes_endpoint(req: UpsertAttributesRequest, ocel: ApiOcel):
    ext_table = DataFrame(req.ext_table)

    upsert_attributes(
        ocel=ocel.ocel,
        extentsion_table=ext_table,
        table=req.table,
        merge_fields=req.merge_fields,
        added_columns=req.added_columns,
        replace=req.replace,
    )

    return {"status": "success"}


class UpsertObjectsRequest(BaseModel):
    ext_table: List[Dict[str, Any]] = Field(
        ..., description="List of object rows as dicts"
    )
    object_fields: Tuple[str, str] = Field(
        ..., description="Tuple of (oid column, otype column)"
    )
    added_attributes: List[Tuple[str, str]] = Field(
        ..., description="List of (CSV column, OCEL attribute)"
    )
    replace: bool = True


@router.post("/ocel/upsert-objects")
def upsert_objects_endpoint(req: UpsertObjectsRequest, ocel: ApiOcel):
    ext_table = DataFrame(req.ext_table)

    upsert_objects(
        ocel=ocel.ocel,
        object_table=ext_table,
        object_fields=req.object_fields,
        added_attributes=req.added_attributes,
        replace=req.replace,
    )

    print(ocel.ocel.objects)

    return {"status": "success"}


class ApplyO2ORuleRequest(BaseModel):
    rule: O2ORule


@router.post("/ocel/apply-o2o")
def apply_o2o_rule_endpoint(req: ApplyO2ORuleRequest, ocel: ApiOcel):
    new_relations = apply_o2o_rule(ocel.ocel, req.rule)

    return {"relations": new_relations}


class DistributeRequest(BaseModel):
    timetable: List[Tuple[str, float]]  # List of (timestamp, value)
    weights: Optional[Dict[str, float]] = None  # activity -> weight


@router.post("/ocel/distribute-value")
def distribute_value_endpoint(req: DistributeRequest, ocel: ApiOcel):
    timetable = DataFrame.from_records(
        req.timetable, columns=["timetableTimestamp", "timetableValue"]
    )

    distributed_df = distribute(
        ocel=ocel.ocel,
        timetable=timetable,
        timestamp_field="timetableTimestamp",
        value_field="timetableValue",
        weights=req.weights,
    )
    distributed_df = distributed_df.set_index(ocel.ocel.event_id_column)
    ocel.events.loc[distributed_df.index, "distributed_value"] = distributed_df[
        "distributed_value"
    ]

    return {"status": "success", "added_column": "distributed_value"}
