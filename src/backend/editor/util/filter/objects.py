from typing import List, Optional, cast
from pandas.core.frame import DataFrame
from pandas.core.series import Series
from pm4py.objects.ocel.obj import OCEL
import pandas as pd
from editor.model.filter import Filter, ObjectFilter


def filter_mask_by_object_attributes(ocel: OCEL, filters: List[Filter]) -> Series:
    object_mask = pd.Series(True, index=ocel.objects.index)

    for filter_object in filters:
        if filter_object.type == "numerical":
            col = cast(
                pd.Series,
                pd.to_numeric(ocel.objects[filter_object.field_name], errors="coerce"),
            )

            match filter_object.filter:
                case "gt":
                    object_mask &= col > filter_object.value
                case "lt":
                    object_mask &= col < filter_object.value
                case "eq":
                    object_mask &= col == filter_object.value

        elif filter_object.type == "nominal":
            object_mask &= ocel.objects[filter_object.field_name].isin(filter_object.value)

    return object_mask


def apply_object_filter(ocel: OCEL, filter: Optional[ObjectFilter]) -> DataFrame:
    objects = ocel.objects
    mask: Series = pd.Series(True, index=objects.index)

    if filter is None:
        return objects

    # Filter by object types
    if filter.object_types:
        mask &= objects[ocel.object_type_column].isin(filter.object_types)

    # Filter by object attributes
    if filter.attributes:
        mask &= filter_mask_by_object_attributes(ocel, filter.attributes)

    return objects.loc[mask]
