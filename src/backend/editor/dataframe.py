from typing import Any, Callable, Dict, Generic, List, Optional, TypeVar
from pandas import DataFrame
from pydantic import BaseModel
from pydantic.fields import Field


class SortObject(BaseModel):
    by: Optional[str]
    ascending: Optional[bool] = True


T = TypeVar("T")


class PaginatedDataframeResponse(BaseModel, Generic[T]):
    data: List[T]
    page: int = 1
    total_pages: int


def paginated_dataframe(
    df: DataFrame,
    current_page: int,
    page_size: int,
    sort: Optional[SortObject],
    transformer: Callable[[DataFrame], List[T]],
) -> PaginatedDataframeResponse[T]:
    if sort and sort.by:
        if sort.by in df.columns:
            df = df.sort_values(by=sort.by, ascending=sort.ascending)

    total_pages = (len(df) + page_size - 1) // page_size
    page = max(1, current_page)
    start = (page - 1) * page_size
    end = start + page_size
    paginated_df = df.iloc[start:end]

    return PaginatedDataframeResponse(
        **{
            "page": page,
            "total_pages": total_pages,
            "data": transformer(paginated_df),
        }
    )


class GeneralModel(BaseModel):
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        extra = "allow"


def dataframe_to_model(
    df: DataFrame,
    explicit_fields: List[str],
) -> List[GeneralModel]:
    models = []
    records = df.to_dict("records")

    for rec in records:
        model_data = {k: rec[k] for k in explicit_fields}
        model_data["metadata"] = {k: v for k, v in rec.items() if k not in explicit_fields}

        models.append(GeneralModel(**model_data))

    return models
