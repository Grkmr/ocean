from datetime import datetime
from pm4py import OCEL
import pm4py
from pydantic import BaseModel
from typing import Literal, Union, List, cast
import pandas as pd


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

    summary_by_type: dict[str, List[ObjectAttributeSummary]] = {}

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


class RelationCountSummary(BaseModel):
    qualifier: str
    activity: str
    object_type: str
    min_count: int
    max_count: int


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


class OCELActivityCount(BaseModel):
    activity: str
    count: int


class OCELSummary(BaseModel):
    start_timestamp: datetime
    end_timestamp: datetime
    activities: List[OCELActivityCount]
    object_summaries: List[ObjectTypeSummary]
    relation_summaries: List[RelationCountSummary]


def get_ocel_information(ocel: pm4py.OCEL) -> OCELSummary:
    # ⏳ Timestamp range
    timestamp_col = ocel.event_timestamp
    timestamps = ocel.events[timestamp_col].dropna()

    start = cast(pd.Timestamp, timestamps.min())
    end = cast(pd.Timestamp, timestamps.max())

    activity_counts_series = ocel.events[ocel.event_activity].value_counts()
    activities = [
        OCELActivityCount(activity=str(act), count=int(count))
        for act, count in activity_counts_series.items()
    ]

    object_summaries = summarize_object_attributes(ocel)

    relation_summaries = get_ocel_relation_metadata(ocel)

    return OCELSummary(
        start_timestamp=start,
        end_timestamp=end,
        activities=activities,
        object_summaries=object_summaries,
        relation_summaries=relation_summaries,
    )
