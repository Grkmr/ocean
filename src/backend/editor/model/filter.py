from datetime import datetime
from pydantic import BaseModel
from typing import List, Literal, Optional, Union


class NumericalFilter(BaseModel):
    type: Literal["numerical"]
    filter: Literal["eq", "lt", "gt"]
    field_name: str
    value: Union[int, float]


class NominalFilter(BaseModel):
    type: Literal["nominal"]
    field_name: str
    value: List[str]


class TimeSpan(BaseModel):
    start: Optional[datetime] = None
    end: Optional[datetime] = None


Filter = Union[NumericalFilter, NominalFilter]


class EventFilter(BaseModel):
    time_span: Optional[TimeSpan] = None
    activity_names: Optional[List[str]] = None
    object_types: Optional[List[str]] = None
    object_counts: Optional[List[NumericalFilter]] = None
    object_attributes_values: Optional[List[Filter]] = None
    event_attributes: Optional[List[Filter]]


class ObjectFilter(BaseModel):
    object_types: Optional[List[str]] = None
    attributes: Optional[List[Filter]] = None
