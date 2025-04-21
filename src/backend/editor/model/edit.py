from typing import List, Literal, Optional

from pydantic.main import BaseModel

from editor.model.filter import ObjectFilter


class JoinCondition(BaseModel):
    source_attribute: str
    target_attribute: str
    operator: Literal["==", "!=", ">", "<", ">=", "<=", "contains", "regex"] = "=="


class O2ORule(BaseModel):
    relation_type: Literal["o2o"] = "o2o"
    qualifier: str
    source_type: str
    target_type: str
    source_filter: Optional[ObjectFilter] = None
    target_filter: Optional[ObjectFilter] = None
    join_conditions: List[JoinCondition]
