from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any, Callable, Hashable, Literal, Sequence

import numpy as np
import pandas as pd
import pandas.io.formats.style as pd_style
from pandas.core.groupby.generic import DataFrameGroupBy, SeriesGroupBy

from util.jupyter import set_clipboard
from util.latex import LatexFontSize, indent_latex, size_cmd


def format_row_wise(
    styler,
    formatter: dict,
    index: pd.Index | None = None,
    offset: int = 0,
):
    index = index if index is not None else styler.index
    for row, row_formatter in formatter.items():
        row_num = index.get_loc(row)
        for col_num in range(offset, len(styler.columns)):
            styler._display_funcs[(row_num, col_num)] = row_formatter
    return styler


COMMON_COLUMN_RENAMER = {
    "ocel:type": "Object type",
    "ocel:activity": "Activity",
    "ocel:qualifier": "Qualifier",
    "freq": "Freq.",
}


def df_to_latex(
    # x: pd.DataFrame | pd_style.Styler,
    df: pd.DataFrame,
    /,
    *,
    column_format: str | None = None,
    label: str,
    caption: str,
    position: Literal["t", "b", "h", "H"] = "t",
    centering: bool = True,
    na_rep: str = r"{\textemdash}",
    precision: int = 2,
    escape_cells: bool = True,
    escape_columns: bool = True,
    escape_index: bool = True,
    hide_columns: bool = False,
    hide_index: bool = False,
    index_name: str | None | Literal[True] = True,
    columns_name: str | None | Literal[True] = None,
    multirow_align: Literal["c", "t", "b", "naive"] | None = "c",
    multicol_align: Literal["r", "c", "l", "naive-l", "naive-r"] | None = "l",
    siunitx: bool | None = None,
    formatters: dict[str, Any] | None = None,
    row_formatters: dict[str, Any] | None = None,
    show: bool = True,
    copy: bool = False,
    fontsize: LatexFontSize = "small",
    convert_css: bool = False,
    col_renamer: dict[str, str] | None = None,
    auto_col_renaming: bool = True,
    apply_style: Callable[[pd_style.Styler, pd.Index], pd_style.Styler] | None = None,
    postprocess_output: Callable[[str], str] | None = None,
    hrules: Literal[
        "multiindex-midrules", "multiindex-clines", "all", "off"
    ] = "multiindex-midrules",
):
    # df, style = (x, x.style) if isinstance(x, pd.DataFrame) else (x.data, x)  # type: ignore
    df = df.copy()
    original_df = df.copy()
    original_columns = df.columns.copy()

    def auto_renamer(s: str):
        if s in COMMON_COLUMN_RENAMER:
            return COMMON_COLUMN_RENAMER[s]
        parts = s.split("_")
        parts[0] = parts[0].capitalize()
        return " ".join(parts)

    if col_renamer is None:
        col_renamer = {}
    if auto_col_renaming:
        # Automatically rename columns. Replace "_" by " " and capitalize first word.
        # assert not isinstance(df.columns, pd.MultiIndex)
        if isinstance(df.columns, pd.MultiIndex):
            # Apply auto renamer on single index values (not the tuples)
            names = set().union(
                *[df.columns.get_level_values(level) for level in range(df.columns.nlevels)]
            )
            col_renamer.update({x: auto_renamer(x) for x in names if x not in col_renamer})
        else:
            col_renamer.update(
                {col: auto_renamer(col) for col in df.columns if col not in col_renamer}
            )
    if col_renamer:
        if isinstance(df.columns, pd.MultiIndex):
            # Apply auto renamer on single index values (not the tuples)
            df.columns = pd.MultiIndex.from_tuples(
                [tuple(col_renamer.get(x, x) for x in tup) for tup in df.columns.tolist()]
            )
        else:
            df = df.rename(columns=col_renamer, errors="ignore")
        if isinstance(formatters, dict):
            assert not isinstance(df.columns, pd.MultiIndex)
            formatters = {col_renamer.get(col, col): f for col, f in formatters.items()}
    style = df.style
    index = df.index

    if siunitx is True and column_format is not None:
        raise ValueError
    if siunitx is None:
        siunitx = True
    if columns_name is not None:
        raise NotImplementedError(
            "Currently only index name can be shown. Pass column_name=None (default). To keep the columns name, pass index_name=df.columns.name"
        )

    if index_name is True and df.index.name is None and df.columns.name is not None:
        index_name = df.columns.name
    if index_name is True:
        index_name = df.index.name
    if index_name == "":
        index_name = None
    if isinstance(index_name, str) and auto_col_renaming:
        index_name = auto_renamer(index_name)
    reset_index = index_name is not None

    if index_name is not True:
        df.index.name = index_name
    if reset_index:
        df.reset_index(inplace=True)
        df.index.name = None
        style = df.style.hide(axis="index")
    elif hide_index:
        style = style.hide(axis="index")
    if escape_index:
        style = style.format_index(escape="latex", axis="index")

    if escape_columns:
        style = style.format_index(escape="latex", axis="columns")
    elif hide_columns:
        style = style.hide(axis="columns")

    if apply_style is not None:
        style = apply_style(style, original_columns)

    # Format content
    formatters = formatters or {}
    assert apply_style is None or not formatters

    # Auto-detect NumSeriesAgg columns
    if apply_style is None:
        numagg_cols = [
            col for col in df.columns if df[col].apply(lambda x: isinstance(x, NumSeriesAgg)).any()
        ]
        if numagg_cols:
            assert not formatters or set(numagg_cols).isdisjoint(formatters.keys())
            numagg_formatter = lambda numagg: numagg.to_latex()
            if formatters is None:
                formatters = {}
            formatters.update({col: numagg_formatter for col in numagg_cols})

    if apply_style is None:
        style = style.format(
            formatters, na_rep=na_rep, precision=precision, escape="latex" if escape_cells else None
        )
    if row_formatters is not None:
        style = style.pipe(
            format_row_wise, row_formatters, index=index, offset=1 if reset_index else 0
        )

    if not label.startswith("tab:"):
        label = "tab:" + label

    clines = None
    if hrules == "multiindex-clines":
        clines = "skip-last;data"
    elif hrules == "all":
        clines = "all;data"

    # column_align = [getattr(original_df[col], "_align", None) for col in original_df.columns]
    # print(", ".join([str(x) for x in column_align]))
    # if column_format is None and all(column_align):
    #     column_format = "".join([str(x) for x in column_align])

    latex = style.to_latex(
        column_format=column_format,  # example "llll"
        position=position,  # [str] The LaTeX positional argument for tables
        position_float=(
            "centering" if centering else None
        ),  # {"centering", "raggedleft", "raggedright"} or None
        hrules=hrules != "off",
        clines=clines,
        label=label,  # [str] The LaTeX label to be placed inside \label{{}} in the output. This is used with \ref{{}} in the main .tex file.
        caption=caption,  # [str | tuple] If string, the LaTeX table caption included as: \caption{<caption>}. If tuple, i.e (“full caption”, “short caption”), the caption included as: \caption[<caption[1]>]{<caption[0]>}.
        sparse_index=True,
        sparse_columns=True,
        multirow_align=multirow_align,
        multicol_align=multicol_align,
        siunitx=siunitx,
        environment="table",  # or "longtable"
        convert_css=convert_css,
    )

    # LaTeX post-processing

    if hrules == "multiindex-midrules":
        # Add \midrule for MultiIndex
        latex = re.sub(r"\\\\ *%?[^\n]*\n *\\multirow", r"\\\\%\n\\midrule%\n\\multirow", latex)

    lines = latex.split("\n")
    lines_pre_tabular = []
    if fontsize != "normal":
        lines_pre_tabular.append(size_cmd(fontsize))
    begin_tabular_index, end_tabular_index = tuple(
        i
        for i, line in enumerate(lines)
        if line.lstrip().startswith("\\begin{tabular}")
        or line.rstrip().startswith("\\end{tabular}")
    )
    lines = lines[:begin_tabular_index] + lines_pre_tabular + lines[begin_tabular_index:]

    # Custom post-processing in tabular contents (string replacing etc.)
    if postprocess_output is not None:
        lines_before_tabular = lines[:begin_tabular_index]
        lines_in_tabular = lines[begin_tabular_index : end_tabular_index + 1]
        lines_after_tabular = lines[end_tabular_index + 1 :]

        latex_in_tabular = "\n".join(lines_in_tabular)
        latex_in_tabular = postprocess_output(latex_in_tabular)
        lines_in_tabular = latex_in_tabular.split("\n")
        lines = lines_before_tabular + lines_in_tabular + lines_after_tabular

    # Filter out erroneous CSS output
    lines = [
        line
        for line in lines
        if not line.strip().startswith("\\tbody") and not line.strip().startswith("\\ tr")
    ]

    # Move index names to column titles row
    # if not hide_index and not hide_columns:
    #     i_coltitles = [i for i, line in enumerate(lines) if re.match(rf"^\s*(&  ){}")]
    # "&  &"

    latex = indent_latex("\n".join(lines))

    if copy:
        set_clipboard(latex)
    if show:
        print(latex)
    else:
        return latex


def prepend_level(
    x: pd.DataFrame | pd.Series,
    /,
    label: Hashable,
    *,
    axis: Literal[0, 1, "index", "columns"] = "columns",
    name: str | None = None,
):
    """Adds an extra index level on a DataFrame's columns or index. The new level has just one constant value."""
    is_columns = axis in [1, "columns"]
    if isinstance(x, pd.DataFrame):
        old_names = x.columns.names if is_columns else x.index.names
    elif isinstance(x, pd.Series):
        if is_columns:
            old_names = [x.name]
            x = x.to_frame()
        else:
            old_names = x.index.names
    else:
        raise TypeError
    return pd.concat({label: x}, axis=axis, names=[name, *old_names])


def unique_non_null(s):
    return s.dropna().unique()


def int_median_str(r50: float, check: bool = True, mode: Literal["number", "string"] = "string"):
    """Formats a median of integers as string, either returning <n> or <n>.5"""
    i50 = int(np.round(r50))
    if not np.isclose(i50, r50):
        i50 = np.round(r50 * 2) / 2
    if check:
        assert np.isclose(i50, r50)
    return str(i50) if mode == "string" else i50


def make_compact(
    x: dict[str, float | int] | NumSeriesAgg,
    latex: bool = True,
    siunitx: bool = True,
    unit: str | None = None,
    dtype: type = float,
    format: str = ".2f",
):
    if not siunitx and unit is not None:
        raise ValueError
    if isinstance(x, NumSeriesAgg):
        rmin, r50, rmax = x._min, x._median, x._max
    else:
        rmin, r50, rmax = x["min"], x["50%"], x["max"]
    if dtype == int:
        imin, imax = int(rmin), int(rmax)
        # median is either integer or ?.5
        i50 = int_median_str(r50, check=False, mode="number")
        assert np.allclose(
            [imin, i50, imax], [rmin, r50, rmax]
        ), "make_compact received non-integer values when passing dtype=int."
        fmin, f50, fmax = str(imin), str(i50), str(imax)
    else:
        fmin, f50, fmax = f"{rmin:{format}}", f"{r50:{format}}", f"{rmax:{format}}"
    if rmin == rmax:
        if latex and siunitx:
            return f"\\num{{{fmin}}}"
        return fmin

    if latex:
        escape_percent = lambda s: s.replace("%", "\\%")
        strip_percent = lambda s: s.replace("%", "")
        if siunitx:
            ispercentage = format.endswith("%")
            if ispercentage:
                assert unit is None
                fmin, f50, fmax = map(strip_percent, (fmin, f50, fmax))
                unit = "\\percent"
            if unit is not None:
                return f"\\qty{{{f50}}}{{{unit}}} [\\qtyrange{{{fmin}}}{{{fmax}}}{{{unit}}}]"
            return f"\\num{{{f50}}} [\\numrange{{{fmin}}}{{{fmax}}}]"
            # return f"\\num{{{f50}}} [\\num{{{fmin}}} -- \\num{{{fmax}}}]"
        else:
            fmin, f50, fmax = map(escape_percent, (fmin, f50, fmax))
            return f"{f50} [{fmin} -- {fmax}]"
    else:
        return f"{f50} [{fmin} - {fmax}]"


def agg_compact(xs: pd.Series, **kwargs):
    return make_compact(
        {
            "min": xs.min(),
            "50%": xs.median(),
            "max": xs.max(),
        },
        **kwargs,
    )


def infer_dtype(x):
    isinteger = False
    if isinstance(x, pd.DataFrame):
        isinteger = (x.dtypes == np.int64).all()
    elif isinstance(x, pd.Series):
        isinteger = x.dtype == np.int64
    elif isinstance(x, SeriesGroupBy):
        isinteger = (x.dtype == np.int64).all()
    elif isinstance(x, DataFrameGroupBy):
        raise TypeError("dtype cannot be inferred from DataFrameGroupBy")
    return int if isinteger else float


def is_int(x: pd.DataFrame | pd.Series):
    if infer_dtype(x) is int:
        return True
    if isinstance(x, pd.DataFrame):
        values = x.values.flatten()
        values = values[~np.isnan(values)]
    elif isinstance(x, pd.Series):
        values = x[x.notna()]
    else:
        raise TypeError
    return np.allclose(np.round(values), values)


def mmmmstr(
    x,
    /,
    *,
    nonzero: bool = False,
    latex: bool = True,
    siunitx: bool = True,
    unit: str | None = None,
    dtype: type | None = None,
    axis: Literal[0, 1] | None = None,
    **compact_kwargs,
):
    return mmmm(
        x,
        compact=True,
        nonzero=nonzero,
        latex=latex,
        siunitx=siunitx,
        unit=unit,
        dtype=dtype,
        axis=axis,
        **compact_kwargs,
    )


def mmmm(
    x,
    /,
    *,
    nonzero: bool = False,
    sum: bool = False,
    compact: bool = False,
    latex: bool = True,
    siunitx: bool = True,
    unit: str | None = None,
    dtype: type | None = None,
    asobj: bool = False,
    axis: Literal[0, 1] | None = None,
    **compact_kwargs,
):
    """Applies aggregation to mean, min, median, max.
    Applicable to Series, DataFrame, or groupby.
    When passing nonzero=True, includes the fraction of non-zero values.
    When passing compact=True, returns a string representation like "median (min-max)".
    """
    # Infer dtype
    if dtype is None:
        dtype = infer_dtype(x)
    agg_nonzero = lambda xs: (xs != 0).sum() / len(xs)
    # is_int = pd.api.types.is_integer_dtype(x)
    agg_kwargs = {}
    if axis is not None:
        if isinstance(x, pd.DataFrame):
            agg_kwargs["axis"] = axis
        else:
            raise ValueError

    agg = ["mean", "min", "median", "max"]
    if nonzero:
        agg.append(agg_nonzero)  # type: ignore
    if sum:
        agg.append("sum")
    y = x.agg(agg, **agg_kwargs)  # type: ignore
    renamer = {"median": "50%", "<lambda>": "nonzero", "<lambda_0>": "nonzero"}
    _make_compact = lambda x1: make_compact(
        x1, latex=latex, siunitx=siunitx, dtype=dtype, unit=unit, **compact_kwargs
    )
    _agg_compact = lambda x1: agg_compact(
        x1, latex=latex, siunitx=siunitx, dtype=dtype, unit=unit, **compact_kwargs
    )
    _agg_obj = lambda x1: NumSeriesAgg.agg(
        x1, nonzero=nonzero, dtype=dtype, unit=unit, **compact_kwargs
    )
    _obj_from_dict = lambda y1: NumSeriesAgg.from_dict(
        y1, latex=latex, siunitx=siunitx, dtype=dtype, unit=unit, **compact_kwargs
    )

    if isinstance(x, pd.Series) and isinstance(y, pd.Series):
        y.rename(index=renamer, inplace=True)
        # y.columns = ["mean", "min", "50%", "max"]
    elif isinstance(x, pd.DataFrame) and isinstance(y, pd.DataFrame):
        y.rename(renamer, inplace=True, axis=axis)
    elif isinstance(x, DataFrameGroupBy) and isinstance(y, pd.DataFrame):
        # if asobj:
        #     return x.agg(_agg_obj)
        if compact:
            return x.agg(_agg_compact)
        y.rename(columns=renamer, inplace=True, level=1)
    elif isinstance(x, SeriesGroupBy) and isinstance(y, pd.DataFrame):
        if asobj:
            return x.agg(_agg_obj)
        if compact:
            return x.agg(_agg_compact)
        y.rename(columns=renamer, inplace=True)
    else:
        raise TypeError

    if asobj:
        raise NotImplementedError
        if isinstance(x, pd.Series):
            return _obj_from_dict(y)
            # y.columns = ["mean", "min", "50%", "max"]
        elif isinstance(x, pd.DataFrame):
            return y.apply(_obj_from_dict)
    if compact:
        if isinstance(x, pd.Series):
            return _make_compact(y)
            # y.columns = ["mean", "min", "50%", "max"]
        elif isinstance(x, pd.DataFrame):
            return y.apply(_make_compact)

    return y


# display(mmmm(pd.Series([1, 2, 3])))
# display(mmmm(pd.DataFrame({"A": [1, 2, 3]})))
# display(mmmm(pd.DataFrame({"A": [1, 2, 3], "B": [1, 2, 3]})))
# display(mmmm(pd.DataFrame({"A": [1, 2, 3, 4, 5], "B": [1, 2, 3, 4, 5], "G": ["X", "X", "Y", "Y", "Y"]}).groupby("G")))


class NumSeriesAgg:
    def __init__(
        self,
        _mean,
        _min,
        _median,
        _max,
        _nonzero,
        dtype: type = float,
        **compact_kwargs,
    ):
        self._mean = _mean
        self._min = _min
        self._median = _median
        self._max = _max
        self._nonzero = _nonzero
        self.dtype = dtype
        self.compact_kwargs = compact_kwargs
        raise NotImplementedError("DEPR keep using strings for now")

    @staticmethod
    def from_dict(row: dict[str, float | int] | pd.Series, **compact_kwargs):
        return NumSeriesAgg(
            _mean=row.get("mean", None),
            _min=row["min"],
            _median=row["50%"],
            _max=row["max"],
            _nonzero=row.get("nonzero", None),
            **compact_kwargs,
        )

    @staticmethod
    def agg(x: pd.Series, nonzero: bool, **compact_kwargs):
        return NumSeriesAgg(
            _mean=x.mean(),
            _min=x.min(),
            _median=x.median(),
            _max=x.max(),
            _nonzero=((x != 0).sum() / len(x) if len(x) else 0) if nonzero else None,
            **compact_kwargs,
        )

    def __str__(self):
        return make_compact(
            self,
            latex=False,
            dtype=self.dtype,
            **self.compact_kwargs,
        )

    def __format__(self, format_spec=".2f"):
        return make_compact(
            self,
            # latex=True,
            # siunitx=siunitx,
            dtype=self.dtype,
            format=format_spec,
            **self.compact_kwargs,
        )

    def __repr__(self):
        return str(self)

    def to_latex(self, siunitx: bool = True):
        return make_compact(
            self,
            latex=True,
            siunitx=siunitx,
            dtype=self.dtype,
            **self.compact_kwargs,
        )


def series_to_nested_dict(x: pd.Series, values: list | None = None):
    """Converts a Series with a multiindex to a nested dictionary."""
    result = {}
    if values is None:
        values = x.tolist()
    elif len(values) != len(x):
        raise ValueError
    for (idx, _), value in zip(x.items(), values):
        idx = tuple(i if not pd.isna(i) else None for i in idx)  # type: ignore
        d = result
        for key in idx[:-1]:
            d = d.setdefault(key, {})
        d[idx[-1]] = value
    return result


def mirror_dataframe(
    df: pd.DataFrame,
    suffix1: str | int = "_1",
    suffix2: str | int = "_2",
):
    """For a given pandas DataFrame, swaps columns with given suffixes"""
    suffix1, suffix2 = str(suffix1), str(suffix2)
    if suffix1.endswith(suffix2) or suffix2.endswith(suffix1):
        raise NotImplementedError(
            "mirror_dataframe does not support suffixes that are a suffix of each other."
        )
    column_order = df.columns

    def remove_suffix1(col1: str):
        return col1[: -len(suffix1)]

    def remove_suffix2(col2: str):
        return col2[: -len(suffix2)]

    renamer = {}
    for col1 in df.columns:
        if col1.endswith(suffix1):
            col = remove_suffix1(col1)
            col2 = col + suffix2
            if not col2 in df.columns:
                raise ValueError(f"mirror_dataframe: Column {col2} not found.")
            renamer[col1] = col2
            renamer[col2] = col1
    for col2 in df.columns:
        if col2.endswith(suffix2):
            col = remove_suffix2(col2)
            col1 = col + suffix1
            if not col1 in df.columns:
                raise ValueError(f"mirror_dataframe: Column {col1} not found.")
    return df.rename(columns=renamer)[column_order]


def concat_dfs(
    dfs: Sequence[pd.DataFrame | None],
    columns: list[str] | None = None,
    **kwargs,
) -> pd.DataFrame:
    """Concatenate multiple DataFrames (axis=0). pd.concat has problems with empty DataFrames.
    Even if all dfs are empty, this function is able to concatenate them. To ensure reproducible results, pass a columns list."""
    _columns = columns
    if _columns is None:
        _columns = []
        for df in dfs:
            if df is not None:
                _columns += [col for col in df.columns if col not in _columns]
    dfs = [df for df in dfs if df is not None and not df.empty]
    if not dfs:
        return pd.DataFrame([], columns=_columns)
        # raise ValueError("No dataframes to concatenate")
    res = pd.concat(dfs, **kwargs)
    if columns is not None:
        return res.reindex(columns=columns)
    return res


def first_in_group(
    group: DataFrameGroupBy | pd.DataFrame | pd.Series,
    /,
    value: Callable[[pd.DataFrame], pd.Series] | str,
    condition: Callable[[pd.DataFrame], pd.Series] | str | None = None,
):
    if isinstance(group, DataFrameGroupBy):
        call = lambda g: first_in_group(g, value=value, condition=condition)
        return group.apply(call, include_groups=False)  # type: ignore

    if condition is None:
        filtered_group = group
    elif isinstance(condition, str):
        filtered_group = group[group[condition]]
    else:
        filtered_group = group[condition(group)]  # type: ignore

    if filtered_group.empty:
        return None
    # Return the first value inside filtered group
    if isinstance(value, str):
        values = filtered_group[value]
    else:
        values = value(filtered_group)  # type: ignore
    return values.iloc[0]


# first_in_group(
#     pd.DataFrame(
#         [
#             {"A": 1, "B": 0, "C": False},
#             {"A": 1, "B": 42, "C": True},
#             {"A": 2, "B": 0, "C": False},
#             {"A": 2, "B": 52, "C": True},
#             {"A": 2, "B": 0, "C": True},
#         ]
#     ).groupby("A"),
#     value="B",
#     condition="C",
# )


def style_multiindex(df: pd.DataFrame | pd_style.Styler):  # type: ignore
    slight_border = ".5px solid rgba(255, 255, 255, .25)"
    strong_border = "3px solid rgba(255, 255, 255, .5)"
    no_background = "#1f1f1f"

    style = df.style if isinstance(df, pd.DataFrame) else df
    return style.set_table_styles(
        [
            {
                "selector": "tbody tr:first-child, tr:has(th[rowspan].level0)",
                "props": [("border-top", strong_border)],
            },
            {
                "selector": "tbody tr:last-child",
                "props": [("border-bottom", strong_border)],
            },
            # {"selector": "tr th[rowspan]", "props": [("background", no_background)]},
            {"selector": "tbody tr", "props": [("border-top", slight_border)]},
            {"selector": "tbody tr:last-child", "props": [("border-bottom", slight_border)]},
        ]
    )


def index_order(order: list[str], subset: list[str] | None = None):
    """To be used as key for df.sort_index.
    Pass the desired order of index values as a list. For MultiIndex, allows specifying a subset of level names.
    """
    indices = {x: i for i, x in enumerate(order)}
    n = len(order)

    def sorter(ix: pd.Index):
        if subset is not None and ix.name not in subset:
            # return ix
            return np.full_like(ix, np.nan)
        return [indices.get(k, n) for k in ix]

    return sorter
