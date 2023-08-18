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
    dataset_id = sys.argv[1]
    version = sys.argv[2]
    dfh = DataFrameHelper(dataset_id=dataset_id, session_id="", connect_to_mongo=True)
    dfh.start_profiling(version=version)
    spark_session = dfh.spark_session
except Exception as e:
    print(str(e))
finally:
    if spark_session:
        spark_session.stop()
