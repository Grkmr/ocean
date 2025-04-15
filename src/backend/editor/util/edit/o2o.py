from typing import List
import pandas as pd
from pm4py import OCEL
from editor.model.edit import O2ORule
from editor.model.filter import ObjectFilter
from editor.util.filter.objects import apply_object_filter


def apply_operator(left: pd.Series, operator: str, right) -> pd.Series:
    if operator == "==":
        return left == right
    if operator == "!=":
        return left != right
    if operator == ">":
        return left > right
    if operator == "<":
        return left < right
    if operator == ">=":
        return left >= right
    if operator == "<=":
        return left <= right
    if operator == "contains":
        return left.astype(str).str.contains(str(right), na=False)
    if operator == "regex":
        return left.astype(str).str.match(right, na=False)
    raise ValueError(f"Unsupported operator: {operator}")


def apply_o2o_rule(ocel: OCEL, rule: O2ORule) -> List[dict]:
    """
    Apply an o2o rule using Pydantic rule model.
    """

    source_objs = apply_object_filter(
        ocel, rule.source_filter or ObjectFilter(object_types=[rule.source_type])
    ).copy()

    target_objs = apply_object_filter(
        ocel, rule.target_filter or ObjectFilter(object_types=[rule.target_type])
    ).copy()

    if source_objs.empty or target_objs.empty:
        return []

    eq_conditions = [cond for cond in rule.join_conditions if cond.operator == "=="]
    other_conditions = [cond for cond in rule.join_conditions if cond.operator != "=="]

    if eq_conditions:
        merged = source_objs.merge(
            target_objs,
            left_on=[c.source_attribute for c in eq_conditions],
            right_on=[c.target_attribute for c in eq_conditions],
            suffixes=("_src", "_tgt"),
        )
    else:
        source_objs["_tmp_key"] = 1
        target_objs["_tmp_key"] = 1
        merged = source_objs.merge(
            target_objs, on="_tmp_key", suffixes=("_src", "_tgt")
        ).drop(columns="_tmp_key")

    if merged.empty:
        return []

    join_mask = pd.Series(True, index=merged.index)

    for cond in other_conditions:
        left_col = merged[f"{cond.source_attribute}_src"]
        right_col = merged[f"{cond.target_attribute}_tgt"]
        join_mask &= apply_operator(left_col, cond.operator, right_col)

    merged = merged.loc[join_mask]

    if merged.empty:
        return []

    new_relations = merged.rename(
        columns={
            f"{ocel.object_id_column}_src": "source-object",
            f"{ocel.object_id_column}_tgt": "target-object",
        }
    )[["source-object", "target-object"]].copy()

    new_relations["relation-type"] = rule.relation_type

    return new_relations.to_dict(orient="records")
