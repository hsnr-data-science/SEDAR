from pyspark.sql.dataframe import DataFrame
from pyspark.sql.functions import *

C_ID = "~id"
C_DELETED = "cd_deleted"
C_HASH = "hash"

def get_change_data(left: DataFrame, right: DataFrame, id_col: str = None) -> DataFrame:
    if not id_col:
        raise Exception("[DIFF] Cannot calucalate updates with no id column")

    # calc hash
    cols = left.schema.names
    left = left.withColumn(C_HASH, hash(*cols)).withColumn(C_ID, left[id_col])
    right = right.withColumn(C_HASH, hash(*cols)).withColumn(C_ID, right[id_col])

    join = left.join(right, C_ID, "fullouter")
    join = join.filter(
        left[C_HASH].isNull() | right[C_HASH].isNull() | (left[C_HASH] != right[C_HASH])
    )
    join = join.withColumn(C_DELETED, right[C_HASH].isNull())

    selectors = [when(right[c].isNull(), left[c]).otherwise(right[c]).alias(c) for c in cols]
    join = join.select(C_DELETED, *selectors)

    return join

def merge_change_data_to_dataframe(
    target: DataFrame, change_data: DataFrame, id_col: str
) -> DataFrame:
    if not id_col:
        raise Exception("[DIFF] Change data cannot be applied without an id column")

    cols = target.schema.names

    target = target.withColumn(C_ID, target[id_col])
    change_data = change_data.withColumn(C_ID, change_data[id_col])

    join = target.join(change_data, C_ID, "full")
    join = join.withColumn(
        C_DELETED, when(change_data[C_DELETED].isNull(), False).otherwise(change_data[C_DELETED])
    )

    join = join.filter(join[C_DELETED] != True)

    # merge columns and take changes
    select_cols = [
        when(target[c].isNull() | (target[c] != change_data[c]), change_data[c])
        .otherwise(target[c])
        .alias(c)
        for c in cols
    ]
    return join.select(*select_cols).repartition(target.rdd.getNumPartitions())
