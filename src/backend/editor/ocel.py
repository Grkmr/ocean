from pm4py import OCEL
from api.model.editor import EventFilter
import pandas as pd


def apply_event_filter(ocel: OCEL, filter: EventFilter):
    events = ocel.events
    timestamp_field = ocel.event_timestamp
    activity_field_name = ocel.event_activity
    mask = pd.Series(True, index=events.index)

    if filter.time_span.start is not None:
        mask &= events[timestamp_field] >= filter.time_span.start

    if filter.time_span.end is not None:
        mask &= events[timestamp_field] <= filter.time_span.end

    if filter.activity_names is not None:
        mask &= events[activity_field_name].isin(filter.activity_names)

    return events[mask]
