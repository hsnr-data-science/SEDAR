import os
import sys
import inspect

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
sys.path.insert(0, os.path.dirname(os.path.dirname(currentdir))) 

from commons.services.data_frame_helper import DataFrameHelper

import os

from delta import *
from pyspark.sql.session import SparkSession

spark_session: SparkSession = None

try:
    datasource_id = sys.argv[1]
    dfh = DataFrameHelper("", "", datasource_id=datasource_id, connect_to_mongo=True)
    dfh.start_exctracting_schema()
    spark_session = dfh.spark_session
except Exception as e:
    print(str(e))
finally:
    if spark_session:
        spark_session.stop()
