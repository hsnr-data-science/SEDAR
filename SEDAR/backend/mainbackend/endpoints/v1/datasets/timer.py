from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from commons.services.data_frame_helper import DataFrameHelper
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import  dataset_logs_data_access


@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(can_write=True)
@parse_params(
    Argument("timer", default=None, type=str, required=False, action='append'),
)
def put_timer(workspace_id:str, dataset_id:str, timer):
    """
    API put request for changing the continuation timer of the current revision.

    :param workspace_id: id of the workspace.
    :param dataset_id: if of the dataset.
    :param timer: new timer als list.
    :returns: None.
    """
    try:
        user = get_jwt_identity()['email']
        dfh = DataFrameHelper(dataset_id, without_session=True)
        revision = dfh.datasource.resolve_current_revision()
        if timer==None:
            revision.continuation_timers = []
        else:
            revision.continuation_timers = []
            for t in timer:
                revision.continuation_timers.append(t)
        dfh.datasource.save();
        try:
            dataset_logs_data_access.create(dataset_id, {"en":f"The continuation timer was updated.", "de":f"Der Continuation Timer wurde angepasst."}, "UPDATE", user)
        except:
            pass
        return "", 201
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

    