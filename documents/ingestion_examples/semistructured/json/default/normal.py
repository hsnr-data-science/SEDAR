from pyspark.sql import DataFrame
from pyspark.sql.functions import explode


def after_load(dataframe: DataFrame) -> DataFrame:

    dataframe = dataframe.select(explode("colors").alias("data")).select(
        "data.description", "data.hex", "data.alternatives"
    )
    return dataframe
