from commons.services.data_frame_helper import DataFrameHelper
from services.decorators import parse_params
from apscheduler.schedulers.background import BackgroundScheduler

@parse_params()
def extract_schema(datasource_id:str):
    """
    API get request to start the schema extraction.

    :returns: okay if started.
    """  
    try:
        dfh = DataFrameHelper(None, datasource_id=datasource_id)
        scheduler = BackgroundScheduler()
        scheduler.add_job(lambda: dfh.start_exctracting_schema())
        scheduler.start()
        return '', 200
    except Exception as ex:
        return str(ex), 500

def index_sourcedata(workspace_id:str, dataset_id:str):
    """
    Function to index the data to elasticsearch.
    """  
    try:
        dfh = DataFrameHelper(dataset_id)
        dfh.start_indexing_sourcedata()
        return 
    except Exception as ex:
        return str(ex)

def delete_sourcedata_from_index(workspace_id:str, dataset_id:str):
    """
    Function to remove sourcedata form the index in elastisearch.
    """  
    try:
        dfh = DataFrameHelper(dataset_id, without_session=True)
        dfh.remove_sourcedata_from_index()
        return 
    except Exception as ex:
        return str(ex)