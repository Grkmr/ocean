from typing import List, Optional, cast

import pandas as pd
import pm4py
from pm4py import OCEL
from pydantic import BaseModel

from api.dependencies import ApiOcel
from editor.model.api import (
    NominalAttribute,
    NumericalAttribute,
    AttributeSummary,
    ObjectTypeSummary,
    OCELActivityCount,
    OCELSummary,
    RelationCountSummary,
)
from editor.model.filter import EventFilter
from editor.util.filter.events import apply_event_filter
from ocel.attribute import AttributeDefinition


def melt_df(df: pd.DataFrame, type_col: str, cols: list[str]) -> pd.DataFrame:
    return (
        df[[type_col] + cols]
        .melt(id_vars=type_col, var_name="attribute", value_name="value")
        .dropna(subset=["value"])
    )


def summarize_attribute(df: pd.DataFrame, type_collumn: str):
    summary_by_type: dict[str, List[AttributeSummary]] = {}

    grouped = df.groupby([type_collumn, "attribute"])

    for (type_name, attr), group in grouped:  ## type:ignore
        values = group["value"].dropna()

        if type_name not in summary_by_type:
            summary_by_type[type_name] = []

        try:
            numeric_values = pd.to_numeric(values, errors="raise")
            is_numeric = True
        except Exception:
            is_numeric = False

        if is_numeric:
            summary = NumericalAttribute(
                attribute=attr,
                type="numerical",
                min=numeric_values.min(),  # type:ignore
                max=numeric_values.max(),  # type:ignore
            )
        else:
            unique_vals = values.unique()
            summary = NominalAttribute(
                attribute=attr,
                type="nominal",
                sample_values=unique_vals.tolist(),
                num_unique=len(unique_vals),
            )

        summary_by_type.setdefault(type_name, []).append(summary)

    return summary_by_type


def summarize_event_attributes(ocel) -> dict[str, List[AttributeSummary]]:
    event_attribute_names = [
        col
        for col in pm4py.ocel_get_attribute_names(ocel)
        if col in ocel.events.columns
    ]

    melted_event_attributes = melt_df(
        ocel.events, ocel.event_activity, event_attribute_names
    )

    return summarize_attribute(melted_event_attributes, ocel.event_activity)


def summarize_object_attributes_v2(ocel: OCEL) -> dict[str, List[AttributeSummary]]:
    obj_type_col = ocel.object_type_column

    # Get valid attributes per dataset
    attribute_names = pm4py.ocel_get_attribute_names(ocel)
    object_cols = [col for col in attribute_names if col in ocel.objects.columns]
    object_changes_cols = [
        col for col in attribute_names if col in ocel.object_changes.columns
    ]

    melted_objects = melt_df(
        ocel.objects.mask(ocel.objects == "null"), obj_type_col, object_cols
    )
    melted_changes = melt_df(
        ocel.object_changes.mask(ocel.object_changes == "null"),
        obj_type_col,
        object_changes_cols,
    )

    metadata = pd.concat([melted_objects, melted_changes], ignore_index=True)

    return summarize_attribute(metadata, obj_type_col)


def summarize_object_attributes(
    ocel: OCEL, max_unique: int = 100
) -> List[ObjectTypeSummary]:
    obj_type_col = ocel.object_type_column

    # Get valid attributes per dataset
    attribute_names = pm4py.ocel_get_attribute_names(ocel)
    object_cols = [col for col in attribute_names if col in ocel.objects.columns]
    object_changes_cols = [
        col for col in attribute_names if col in ocel.object_changes.columns
    ]

    # Melt and merge metadata
    def melt_df(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
        return (
            df[[obj_type_col] + cols]
            .melt(id_vars=obj_type_col, var_name="attribute", value_name="value")
            .dropna(subset=["value"])
        )

    melted_objects = melt_df(ocel.objects.mask(ocel.objects == "null"), object_cols)
    melted_changes = melt_df(
        ocel.object_changes.mask(ocel.object_changes == "null"), object_changes_cols
    )

    metadata = pd.concat([melted_objects, melted_changes], ignore_index=True)

    summary_by_type: dict[str, List[AttributeSummary]] = {}

    grouped = metadata.groupby([obj_type_col, "attribute"])

    for (obj_type, attr), group in grouped:  ## type:ignore
        values = group["value"].dropna()

        if obj_type not in summary_by_type:
            summary_by_type[obj_type] = []

        try:
            numeric_values = pd.to_numeric(values, errors="raise")
            is_numeric = True
        except Exception:
            is_numeric = False

        if is_numeric:
            summary = NumericalAttribute(
                attribute=attr,
                type="numerical",
                min=numeric_values.min(),  # type:ignore
                max=numeric_values.max(),  # type:ignore
            )
        else:
            unique_vals = values.unique()
            summary = NominalAttribute(
                attribute=attr,
                type="nominal",
                sample_values=unique_vals[:max_unique].tolist(),
                num_unique=len(unique_vals),
            )

        summary_by_type.setdefault(obj_type, []).append(summary)

    return [
        ObjectTypeSummary(object_type=otype, attributes=attrs)
        for otype, attrs in summary_by_type.items()
    ]


def get_ocel_relation_metadata(ocel: pm4py.OCEL) -> List[RelationCountSummary]:
    qualifier_col = ocel.qualifier
    activity_col = ocel.event_activity
    object_type_col = ocel.object_type_column
    event_id_col = ocel.event_id_column

    grouped_relations = (
        ocel.relations.groupby(
            [event_id_col, qualifier_col, activity_col, object_type_col]
        )
        .size()
        .reset_index()
        .rename(columns={0: "count"})
    )

    summary: pd.DataFrame = (
        grouped_relations.groupby([qualifier_col, activity_col, object_type_col])[
            "count"
        ]
        .agg(["min", "max"])
        .reset_index()
        .rename(columns={"min": "min_count", "max": "max_count"})
    )

    summaries = [
        RelationCountSummary(
            qualifier=cast(str, row[qualifier_col]),
            activity=cast(str, row[activity_col]),
            object_type=cast(str, row[object_type_col]),
            min_count=cast(int, row["min_count"]),
            max_count=cast(int, row["max_count"]),
        )
        for _, row in summary.iterrows()
    ]
    return summaries


def get_ocel_information(
    api_ocel: ApiOcel, event_filter: Optional[EventFilter]
) -> OCELSummary:
    ocel = api_ocel.ocel
    timestamp_col = ocel.event_timestamp
    timestamps = ocel.events[timestamp_col].dropna()

    start = cast(pd.Timestamp, timestamps.min())
    end = cast(pd.Timestamp, timestamps.max())

    if event_filter is None:
        activity_counts_series = ocel.events[ocel.event_activity].value_counts()
    else:
        activity_counts_series = apply_event_filter(ocel, event_filter)[
            ocel.event_activity
        ].value_counts()

    activities = [
        OCELActivityCount(activity=str(act), count=int(count))
        for act, count in activity_counts_series.items()
    ]

    object_summaries = summarize_object_attributes(ocel)

    event_summaries = summarize_event_attributes(ocel)

    relation_summaries = get_ocel_relation_metadata(ocel)

    return OCELSummary(
        start_timestamp=start,
        end_timestamp=end,
        activities=activities,
        object_summaries=object_summaries,
        relation_summaries=relation_summaries,
        event_summaries=event_summaries,
    )
