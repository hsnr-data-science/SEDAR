from flask_jwt_extended import jwt_required, get_jwt_identity
from services.test import TestService
from commons.models.dataset.models import Test
from services.decorators import check_credentials
from werkzeug.exceptions import InternalServerError
from apscheduler.schedulers.background import BackgroundScheduler

@jwt_required()
@check_credentials()
def get():
    """
    API to get the test results.

    :return: results.
    """
    try:
        test = Test.nodes.all()
        
        if not test:
            test = Test()
            test.save()
            return test.serialize(), 200

        return test[0].serialize(), 200
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_credentials()
def post():
    """
    API to start the test.

    :return: results.
    """
    try:
        test = Test.nodes.all()
        test_service = TestService(test[0], get_jwt_identity()["email"])
        if len(test_service.test.test_cases)!=0:
            for tc in test_service.test.test_cases:
                tc.delete()
        scheduler = BackgroundScheduler()
        scheduler.add_job(lambda: test_service.start())
        scheduler.start()
        return test_service.test.serialize(), 200
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")