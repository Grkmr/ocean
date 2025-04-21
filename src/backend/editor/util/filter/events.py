from datetime import datetime
from pandas.core.frame import DataFrame
from pandas.core.series import Series
from pm4py import OCEL
from pydantic import BaseModel
import pandas as pd
from typing import List, Literal, Optional, Union, cast
from editor.model.filter import EventFilter, Filter, NumericalFilter


def filter_by_object_count(ocel: OCEL, filter_array: list[NumericalFilter]):
    type_counts = (
        ocel.relations.groupby([ocel.event_id_column, ocel.object_type_column])
        .size()
        .unstack(fill_value=0)
    )
    event_mask: pd.Series = pd.Series(True, index=type_counts.index)

    for filter_object in filter_array:
        if filter_object.field_name in type_counts.columns:
            match filter_object.filter:
                case "lt":
                    event_mask &= type_counts[filter_object.field_name] <= filter_object.value
                case "gt":
                    event_mask &= type_counts[filter_object.field_name] >= filter_object.value
                case "eq":
                    event_mask &= type_counts[filter_object.field_name] == filter_object.value
        else:
            event_mask &= False

    matching_eids = event_mask.loc[event_mask].index
    return matching_eids


def filter_by_object_attributes_values(ocel: OCEL, filter_array: list[Filter]):
    objects = ocel.objects
    relations = ocel.relations

    for i, filter_object in enumerate(filter_array):
        object_mask = pd.Series(True, index=objects.index)

        if filter_object.type == "numerical":
            match filter_object.filter:
                case "gt":
                    object_mask &= objects[filter_object.field_name] >= filter_object.value
                case "lt":
                    object_mask &= objects[filter_object.field_name] <= filter_object.value
                case "eq":
                    object_mask &= objects[filter_object.field_name] == filter_object.value

        if filter_object.type == "nominal":
            object_mask &= objects[filter_object.field_name].isin(filter_object.value)

        relations[i] = relations[ocel.object_id_column].isin(
            objects.loc[object_mask, ocel.object_id_column]
        )

    grouped_any = relations.groupby(ocel.event_id_column)[list(range(len(filter_array)))].any()

    # TODO Fix this
    passes_all_filters: pd.Series = grouped_any.all(axis=1)  # type: ignore

    return passes_all_filters.loc[passes_all_filters].index


def filter_mask_by_event_attributes(ocel: OCEL, filters: List[Filter]):
    event_mask = pd.Series(True, index=ocel.events.index)
    for filter_object in filters:
        if filter_object.type == "numerical":
            col = cast(
                pd.Series,
                pd.to_numeric(ocel.events[filter_object.field_name], errors="coerce"),
            )

            match filter_object.filter:
                case "gt":
                    event_mask &= col >= filter_object.value
                case "lt":
                    event_mask &= col <= filter_object.value
                case "eq":
                    event_mask &= col == filter_object.value

        if filter_object.type == "nominal":
            event_mask &= ocel.events[filter_object.field_name].isin(filter_object.value)
    return event_mask


def apply_event_filter(ocel: OCEL, filter: EventFilter) -> DataFrame:
    events: DataFrame = ocel.events
    timestamp_field = ocel.event_timestamp
    activity_field_name = ocel.event_activity
    mask: Series = pd.Series(True, index=events.index)
    events = ocel.events
    relations = ocel.relations
    event_id_col = ocel.event_id_column
    object_type_col = ocel.object_type_column

    if filter.time_span is not None:
        if filter.time_span.start is not None:
            mask &= events[timestamp_field] >= filter.time_span.start

        if filter.time_span.end is not None:
            mask &= events[timestamp_field] <= filter.time_span.end

    if filter.activity_names is not None:
        mask &= events[activity_field_name].isin(filter.activity_names)

    if filter.object_types:
        relevant_event_ids = relations.loc[
            relations[object_type_col].isin(filter.object_types), event_id_col
        ].unique()
        mask &= events[event_id_col].isin(relevant_event_ids)

    if filter.object_counts:
        matching_event_ids = filter_by_object_count(ocel, filter.object_counts)
        mask &= events[event_id_col].isin(matching_event_ids)

    if filter.object_attributes_values:
        matching_event_ids = filter_by_object_attributes_values(
            ocel, filter.object_attributes_values
        )
        mask &= events[event_id_col].isin(matching_event_ids)

    if filter.event_attributes:
        event_mask = filter_mask_by_event_attributes(ocel, filter.event_attributes)
        mask &= event_mask

    return cast(DataFrame, events[mask])
