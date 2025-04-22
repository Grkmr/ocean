from typing import Dict, List
from fastapi.routing import APIRouter
from pydantic.main import BaseModel

from api.dependencies import ApiOcel
from editor.model.api import O2ORelation
from ocel.attribute import OCELAttribute


router = APIRouter(prefix="/overview", tags=["editor"])


class ObjectRealtionsResponse(BaseModel):
    relations: List[O2ORelation]
    attributes: List[OCELAttribute]
    object_type_count: Dict[str, int]


@router.post("/objectGraph", response_model=ObjectRealtionsResponse)
def objects_relations(ocel: ApiOcel) -> ObjectRealtionsResponse:
    object_attributes = [a for a in ocel.attributes if a.target == "object"]
    o2oRelations: List[O2ORelation] = [
        O2ORelation(**row.to_dict())
        for _, row in ocel.o2o_type_frequencies.rename(
            columns={
                "ocel:type_1": "src",
                "ocel:type_2": "target",
                "ocel:qualifier": "qualifier",
            }
        ).iterrows()
    ]

    return ObjectRealtionsResponse(
        relations=o2oRelations,
        attributes=object_attributes,
        object_type_count=ocel.otype_counts.astype(int).to_dict(),
    )
