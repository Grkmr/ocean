from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TimeSpan(BaseModel):
    start: Optional[datetime] = None
    end: Optional[datetime] = None


class EventFilter(BaseModel):
    time_span: TimeSpan
    activity_names: Optional[List[str]] = None
    object_types: Optional[List[str]] = None
