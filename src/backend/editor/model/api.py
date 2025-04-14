from datetime import datetime
from typing import Generic, List, Literal, TypeVar, Union
from pydantic.main import BaseModel


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


ObjectAttributeSummary = Union[NumericalAttribute, NominalAttribute]


class ObjectTypeSummary(BaseModel):
    object_type: str
    attributes: List[ObjectAttributeSummary]


class OCELActivityCount(BaseModel):
    activity: str
    count: int


class RelationCountSummary(BaseModel):
    qualifier: str
    activity: str
    object_type: str
    min_count: int
    max_count: int


class OCELSummary(BaseModel):
    start_timestamp: datetime
    end_timestamp: datetime
    activities: List[OCELActivityCount]
    object_summaries: List[ObjectTypeSummary]
    relation_summaries: List[RelationCountSummary]
