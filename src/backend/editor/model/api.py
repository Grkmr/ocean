from typing import Generic, TypeVar

from pydantic.main import BaseModel


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    page: int
    totalPages: int
    data: list[T]
