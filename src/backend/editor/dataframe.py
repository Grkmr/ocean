from typing import Optional
from pandas import DataFrame
from pydantic import BaseModel


class SortObject(BaseModel):
    by: Optional[str]
    ascending: Optional[bool] = True


class PaginatedDataframeInput(BaseModel):
    df: DataFrame
    currentPage: int = 1
    pageSize: int
    sort: Optional[SortObject]


def paginated_dataframe(input=PaginatedDataframeInput):
    df = input.df

    # 1. Sort if requested
    if input.sort and input.sort.by:
        if input.sort.by in df.columns:
            df = df.sort_values(by=input.sort.by, ascending=input.sort.ascending)

    # 2. Paginate
    total_items = len(df)
    total_pages = (total_items + input.pageSize - 1) // input.pageSize
    page = max(1, input.currentPage)
    start = (page - 1) * input.pageSize
    end = start + input.pageSize
    paginated_df = df.iloc[start:end]

    # 3. Return result with metadata
    return {
        "page": page,
        "pageSize": input.pageSize,
        "totalPages": total_pages,
        "totalItems": total_items,
        "data": paginated_df,
    }
