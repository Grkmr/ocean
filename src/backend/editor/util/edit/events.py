from pandas import DataFrame
from pm4py import OCEL
import pandas as pd


def distribute(
    ocel: OCEL,
    timetable: DataFrame,
    timestamp_field,
    value_field,
    weights=None,
):
    timetable = timetable[[timestamp_field, value_field]].copy()
    timetable[timestamp_field] = pd.to_datetime(timetable[timestamp_field])

    min_time = timetable[timestamp_field].min()
    max_time = timetable[timestamp_field].max()

    if weights:
        relevant_activities = list(weights.keys())
    else:
        relevant_activities = ocel.events[ocel.event_activity].unique()

    events = ocel.events.loc[
        (ocel.events[ocel.event_timestamp] >= min_time)
        & (ocel.events[ocel.event_timestamp] <= max_time)
        & (ocel.events[ocel.event_activity].isin(relevant_activities)),
        [ocel.event_timestamp, ocel.event_activity, ocel.event_id_column],
    ].copy()

    events = events.sort_values(ocel.event_timestamp)
    timetable = timetable.sort_values(timestamp_field)

    merged = pd.merge_asof(
        events,
        timetable,
        left_on=ocel.event_timestamp,
        right_on=timestamp_field,
        direction="nearest",
    )

    merged["weight"] = merged[ocel.event_activity].map(weights or {}).fillna(1)
    merged["total_weight"] = merged.groupby(timestamp_field)["weight"].transform("sum")
    merged["distributed_value"] = merged[value_field] * (merged["weight"] / merged["total_weight"])

    return merged.set_index(ocel.event_id_column)[["distributed_value"]]
