from datetime import datetime
from typing import Generic, List, Literal, TypeVar, Union

from pydantic.main import BaseModel

from ocel.attribute import AttributeDefinition, OCELAttribute

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    page: int
    totalPages: int
    data: list[T]


# Ocel Summeries
class NumericalAttribute(BaseModel):
    attribute: str
    type: Literal["numerical"]
    min: float
    max: float


class NominalAttribute(BaseModel):
    attribute: str
    type: Literal["nominal"]
    sample_values: List[Union[str, int, float]]
    num_unique: int


AttributeSummary = Union[NumericalAttribute, NominalAttribute]


class ObjectTypeSummary(BaseModel):
    object_type: str
    attributes: List[AttributeSummary]


class OCELActivityCount(BaseModel):
    activity: str
    count: int


class RelationCountSummary(BaseModel):
    qualifier: str
    activity: str
    object_type: str
    min_count: int
    max_count: int


class O2ORelation(BaseModel):
    src: str
    target: str
    qualifier: str
    freq: int


class OCELSummary(BaseModel):
    start_timestamp: datetime
    end_timestamp: datetime
    activities: List[OCELActivityCount]
    object_summaries: List[ObjectTypeSummary]
    event_summaries: dict[str, List[AttributeSummary]]
    relation_summaries: List[RelationCountSummary]
