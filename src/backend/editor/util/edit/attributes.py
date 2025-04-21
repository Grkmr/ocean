from typing import List, Literal, Tuple
from pandas.core.frame import DataFrame
from pm4py.objects.ocel.obj import OCEL


def upsert_attributes(
    ocel: OCEL,
    extentsion_table: DataFrame,
    table: Literal["objects", "events"],
    merge_fields: List[Tuple[str, str]],
    added_columns: List[Tuple[str, str]],
    replace: bool = True,  # <-- New parameter
):
    target_table = ocel.objects if table == "objects" else ocel.events

    extentsion_table = extentsion_table[
        [x[0] for x in added_columns] + [x[0] for x in merge_fields]
    ].rename(columns=dict(added_columns))

    merged = target_table.merge(
        extentsion_table,
        left_on=[x[1] for x in merge_fields],
        right_on=[x[0] for x in merge_fields],
        how="left",
        suffixes=("", "_new"),
    )

    for _, col_new in added_columns:
        if f"{col_new}_new" in merged.columns:
            if replace:
                merged[col_new] = merged[f"{col_new}_new"].combine_first(merged[col_new])
            else:
                merged[col_new] = merged[col_new].combine_first(merged[f"{col_new}_new"])
    merged = merged.drop(
        columns=[
            f"{col_new}_new" for _, col_new in added_columns if f"{col_new}_new" in merged.columns
        ]
        + [ext_col for ext_col, target_col in merge_fields if target_col != ext_col]
    )

    if table == "objects":
        ocel.objects = merged
    else:
        ocel.events = merged
