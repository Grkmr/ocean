from typing import List, Tuple
from pandas.core.frame import DataFrame
from pm4py.objects.ocel.obj import OCEL


def upsert_objects(
    ocel: OCEL,
    object_table: DataFrame,
    object_fields: Tuple[str, str],
    added_attributes: List[Tuple[str, str]],
    replace: bool = True,
):
    print(object_table)
    print(object_fields)
    print(added_attributes)
    # Add object type column if missing
    if object_fields[1] not in object_table:
        object_table[object_fields[1]] = object_fields[1]

    # Select and rename columns
    object_table = object_table[
        [x[0] for x in added_attributes] + list(object_fields)
    ].rename(
        columns=dict(
            added_attributes
            + [
                (object_fields[0], ocel.object_id_column),
                (object_fields[1], ocel.object_type_column),
            ]
        )
    )

    # Outer merge to upsert (update + insert)
    merged = ocel.objects.merge(
        object_table,
        on=[ocel.object_id_column, ocel.object_type_column],  # Important!
        how="outer",
        suffixes=("", "_new"),
    )

    # Update existing values or fill missing
    seen_cols = set()
    for _, col_new in added_attributes:
        if col_new in seen_cols:
            continue
        seen_cols.add(col_new)
        if f"{col_new}_new" in merged.columns:
            if replace:
                merged[col_new] = merged[f"{col_new}_new"].combine_first(
                    merged[col_new]
                )
            else:
                merged[col_new] = merged[col_new].combine_first(
                    merged[f"{col_new}_new"]
                )

    # Drop temporary _new columns
    merged = merged.drop(
        columns=[
            f"{col_new}_new"
            for _, col_new in added_attributes
            if f"{col_new}_new" in merged.columns
        ]
    )
    print(merged)

    merged = merged.reset_index(drop=True)

    # Final assignment back to ocel
    ocel.objects = merged
