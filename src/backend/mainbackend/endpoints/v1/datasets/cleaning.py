import datetime
import json
import re
import pydeequ3
import io

from services.decorators import parse_params
from apscheduler.schedulers.background import BackgroundScheduler
from database.data_access import dataset_data_access as data_access

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
import requests
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import NotFound
from werkzeug.exceptions import InternalServerError
from services.decorators import check_permissions_workspace, check_permissions_dataset

from database.data_access import deequdata_data_access
from pydeequ3.checks import *
from pydeequ3.profiles import *
from pydeequ3.suggestions import *
from pydeequ3.verification import *

from commons.services.data_frame_helper import DataFrameHelper
from commons.configuration.settings import Settings

class ConstraintValidation(Resource):
    def __init__(self):
        super().__init__()
        print("Constraint Val")
        self.__column_only_constraints = ["isComplete", "isUnique", "isNonNegative", "isPositive", "containsCreditCardNumber", "containsEmail", "containsSocialSecurityNumber", "containsURL"]
        self.__lambda_only_constraints = ["hasSize"]
        self.__column_related_lambda_constraints = ["hasCompleteness", "hasEntropy", "hasMinLength", "hasMaxLength", "hasMin", "hasMax", "hasMean", "hasSum", "hasStandardDeviation", "hasApproxCountDistinct"]
    
    def _construct_constraint_lambda(self, operator, value):
        if operator == "<":
            return lambda x: x < value
        if operator == "<=":
            return lambda x: x <= value
        if operator == ">":
            return lambda x: x > value
        if operator == ">=":
            return lambda x: x >= value
        return lambda x: x == value

    def _parse_checks(self, constraints, spark_session):
        """
        Converts a constraint validation request to the corresponding pydeequ check objects

        :param constraints: list of JSON constraint objects from frontend
        :param spark_session: spark session which will be used for the constraint validation
        :return: list of pydeequ Check objects
        """
        checks = []
        for constraint in constraints:
            type = constraint["type"]
            params = constraint["params"]
            column = params["column"] if "column" in params else ""

            check = Check(spark_session, CheckLevel.Warning, type + ":" + column)

            if type in self.__column_only_constraints:
                check = getattr(check, type)(column)
            elif type in self.__lambda_only_constraints:
                check = getattr(check, type)(self._construct_constraint_lambda(params["operator"], params["value"]))
            elif type in self.__column_related_lambda_constraints:
                check = getattr(check, type)(column, self._construct_constraint_lambda(params["operator"], params["value"]))
            elif type == "isContainedIn":
                check = check.isContainedIn(column, params["value"].split(","))
            elif type == "hasDataType":
                check = check.hasDataType(column, ConstrainableDataTypes[params["value"]]) # see https://pydeequ.readthedocs.io/en/latest/pydeequ.html#pydeequ.checks.ConstrainableDataTypes

            checks.append(check)
        return checks
    
    def _parse_pydeequ_result(self, raw_result):
        """
        Converts a JSON result from pydeequ to our JSON response for the frontend including performance metrics on a per-constraint and all-constraint basis

        :param raw_result: JSON result from pydeequ
        :return: JSON response for frontend
        """
        status = "PASS"
        index = 0.0

        parsed_result = []

        for result in raw_result:
            single_index = 1.0
            
            if result["constraint_status"] == "Failure":
                status = "FAIL"
                single_index = 0.0

            check_name_parts = result["check"].split(":")
            
            try:
                if result["constraint_message"] != "" and (check_name_parts[0] in self.__column_only_constraints or check_name_parts[0] == "isContainedIn"):
                    single_index = float(re.findall(r'\d+.\d+', result["constraint_message"])[0])
            except:
                # we expect this to happen for constraints without a failure percentage
                pass
            
            index += single_index

            parsed_result.append({
                    "type": check_name_parts[0],
                    "column": check_name_parts[1] if len(check_name_parts) > 1 else "",
                    "status": "FAIL" if result["constraint_status"] == "Failure" else "PASS",
                    "index": single_index,
                    "constraint": result["constraint"],
                    "message": result["constraint_message"]
                })

        index /= len(raw_result)

        response = {
            "summary": {
                "status": status,
                "index": index
            },
            "details": parsed_result
        }

        return response

    #@jwt_required()
    #@check_permissions_workspace()
    #@check_permissions_dataset(can_read=True)
    @parse_params(
        Argument("version", default=0, type=str, required=True),
    )
    def get(self, workspace_id, dataset_id, version:str):
        deequdata = deequdata_data_access.get(dataset_id, version)
        if deequdata.count() > 1 and deequdata.first().validation_result != {}:
            print("WARNING: unexpectedly found several deequdata entries for one datamart; returning first")
            return deequdata.first().validation_result
        elif deequdata.count() == 1 and deequdata.get().validation_result != {}:
            print("Found validation result in db")
            return deequdata.get().validation_result
        else:
            return None


    #@jwt_required
    #@check_permissions_workspace()
    #@check_permissions_dataset(can_read=True)
    @parse_params(
        Argument("version", default=0, type=str, required=True),
    )
    def post(self, workspace_id:str, dataset_id, version:str):
        data = json.loads(request.data)

        dfh = DataFrameHelper(dataset_id, "", connect_to_mongo=True)
        
        spark_session = dfh.spark_session
        
        try:
            checks = self._parse_checks(data["constraints"], spark_session)
            df = dfh.get_source_df(version=version)

            verification_suite = VerificationSuite(spark_session).onData(df)
            for check in checks:
                verification_suite = verification_suite.addCheck(check)

            verification_suite = verification_suite.run()
            raw_result = VerificationResult.checkResultsAsJson(spark_session, verification_suite)
            # spark_session.sparkContext._gateway.shutdown_callback_server()
            # spark_session.stop()

            parsed_result = self._parse_pydeequ_result(raw_result)
            validation_result={"request": data, "response": parsed_result}

            deequdata_data_access.addValidationResult(dataset_id=dataset_id, validation_result=validation_result, version=version)
            return parsed_result
        except Exception as e:
            print(e)
    
    #@jwt_required
    @parse_params(
        Argument("version", default=0, type=str, required=True),
    )
    def delete(self, workspace_id, dataset_id, version:str):
        try:
            deequdata_data_access.delete(dataset_id, version, str("validation_result"))
        except Exception as e:
            print(e)
        

class ConstraintSuggestion(Resource):
    #@jwt_required
    #@check_permissions_workspace()
    #@check_permissions_dataset(can_read=True)
    @parse_params(
        Argument("version", default=0, type=str, required=True),
    )
    def get(self, workspace_id, dataset_id, version:str):
        deequdata = deequdata_data_access.get(dataset_id, version)
        if deequdata.count() > 1 and deequdata.first().suggestions != {}:
            print("WARNING: unexpectedly found several deequdata entries for one dataset; returning first")
            return deequdata.first().suggestions
        elif deequdata.count() == 1 and deequdata.get().suggestions != {}:
            print("Found suggestions in db")
            return deequdata.get().suggestions
        else:
            print("Retrieving suggestions")

            dfh = DataFrameHelper(dataset_id, "", connect_to_mongo=True)
            spark_session = dfh.spark_session
            df = dfh.get_source_df(version=version)

            suggestions = ConstraintSuggestionRunner(spark_session) \
                .onData(df) \
                .addConstraintRule(CompleteIfCompleteRule()) \
                .addConstraintRule(NonNegativeNumbersRule()) \
                .addConstraintRule(RetainTypeRule()) \
                .addConstraintRule(UniqueIfApproximatelyUniqueRule()) \
                .run()
            
            # following constraint suggestions are currently unsupported by our unofficial spark 3.1 pydeequ build, see issue #36
                # .addConstraintRule(CategoricalRangeRule()) \
                # .addConstraintRule(FractionalCategoricalRangeRule()) \
            # optimum would be .addContraintRule(DEFAULT())

            deequdata_data_access.addConstraintSuggestions(dataset_id=dataset_id, suggestions=suggestions, version=version)

            return suggestions


class Filters(Resource):
    """
    Class for filter generation and execution, Valid methods: [post]
    """
    TEMP_VIEW_NAME = "TempViewFilters"

    # TODO: is there a way to reference the definitions in the scala source of Deequ instead of copying?
    CC_REGEX = """\b(?:3[47]\d{2}([\ \-]?)\d{6}\1\d|(?:(?:4\d|5[1-5]|65)\d{2}|6011)([\ \-]?)\d{4}\2\d{4}\2)\d{4}\b"""
    EMAIL_REGEX = """(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])"""
    SSN_REGEX = """((?!219-09-9999|078-05-1120)(?!666|000|9\d{2})\d{3}-(?!00)\d{2}-(?!0{4})\d{4})|((?!219 09 9999|078 05 1120)(?!666|000|9\d{2})\d{3} (?!00)\d{2} (?!0{4})\d{4})|((?!219099999|078051120)(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4})"""
    URL_REGEX = """(https?|ftp)://[^\s/$.?#].[^\s]*"""

    #@jwt_required()
    #@check_permissions_workspace()
    #@check_permissions_dataset(can_read=True)
    def post(self, workspace_id, dataset_id):
        """
        Generates filter suggestions based on a given constraint set or executes the generated filter expressions when a dataframe uid is given
        """
        data = json.loads(request.data)

        filters = {"filters": []}
        for constraint in data["constraints"]:
            type = constraint["type"]
            params = constraint["params"]
            column = params["column"] if "column" in params else ""
            if hasattr(self, type):
                filter_expression = getattr(self, type)(params)
                if filter_expression:
                    filters["filters"].append({
                        "type": type,
                        "column": column,
                        "filter_expression": filter_expression
                    })

        return filters
    
    
    @jwt_required()
    @parse_params(
        Argument("version", default=0, type=str, required=True)
    )
    def put(self, workspace_id, dataset_id, version):
        data = json.loads(request.data)

        dfh = DataFrameHelper(dataset_id)
        df = dfh.get_source_df(version=version)

        df.createOrReplaceTempView(self.TEMP_VIEW_NAME)  # make isUnique filter possible
        for filter in data["filters"]:
            df = df.filter(filter["filter_expression"])
   
        

        datasourcedefinition = json.loads(data['datasourcedefinition'])
        datasourcedefinition = {"datasource_definition": datasourcedefinition}
        print(datasourcedefinition)
        
        access_token=create_access_token(identity={'email':get_jwt_identity()["email"]})
        
        filename = datasourcedefinition['datasource_definition']['name']
        datasourcedefinition['datasource_definition']['source_files'][0] = filename
        
        file = io.BytesIO(json.dumps(df.toJSON().map(lambda d: json.loads(d)).collect()).encode('utf-8'))

        files = {filename:(f'{filename}.json', file, 'application/json')}
        print(files)
        settings = Settings()

        params = {
                "filename": filename, 
                "write_type": datasourcedefinition['datasource_definition']['write_type'], 
                "id_column":datasourcedefinition['datasource_definition']['id_column'] 
                }
        print(params)
        resp = requests.put(
            f"http://{settings.server.host}:{settings.server.port}/api/v1/workspaces/{workspace_id}/datasets/{dataset_id}/update-datasource",
            files=files,
            params=params,
            cookies={"access_token_cookie":access_token}
        )
        if resp.ok:
            resp2 = requests.get(
            f"http://{settings.server.host}:{settings.server.port}/api/v1/workspaces/{workspace_id}/datasets/{dataset_id}/run-ingestion",
            cookies={"access_token_cookie":access_token}
            )
            if resp2.ok:
                return "", 200
        else:
            return resp.raise_for_status()
        
        


    def isComplete(self, params):
        if "column" in params:
            return "{0} IS NOT NULL".format(params["column"])

    def isUnique(self, params):
        if "column" in params:
            return "{0} IN (SELECT {0} FROM {1} GROUP BY {0} HAVING COUNT(1) = 1)".format(params["column"], self.TEMP_VIEW_NAME)

    def isNonNegative(self, params):
        if "column" in params:
            return "{0} >= 0".format(params["column"])

    def isPositive(self, params):
        if "column" in params:
            return "{0} > 0".format(params["column"])

    def containsCreditCardNumber(self, params):
        if "column" in params:
            return "rlike({0}, '{1}')".format(params["column"], self.CC_REGEX)

    """ problem with parsing the email regex
    def containsEmail(self, params):
        if "column" in params:
            return "rlike({0}, '{1}')".format(params["column"], self.EMAIL_REGEX) """

    def containsSocialSecurityNumber(self, params):
        if "column" in params:
            return "rlike({0}, '{1}')".format(params["column"], self.SSN_REGEX)

    def containsURL(self, params):
        if "column" in params:
            return "rlike({0}, '{1}')".format(params["column"], self.URL_REGEX)

    def hasMinLength(self, params):
        if "column" in params and "operator" in params and "value" in params and params["operator"] == ">=":
            return "length({0}) >= {1}".format(params["column"], params["value"])

    def hasMaxLength(self, params):
        if "column" in params and "operator" in params and "value" in params and params["operator"] == "<=":
            return "length({0}) <= {1}".format(params["column"], params["value"])

    def hasMin(self, params):
        if "column" in params and "operator" in params and "value" in params and params["operator"] == ">=":
            return "{0} >= {1}".format(params["column"], params["value"])

    def hasMax(self, params):
        if "column" in params and "operator" in params and "value" in params and params["operator"] == "<=":
            return "{0} <= {1}".format(params["column"], params["value"])

    def isContainedIn(self, params):
        if "column" in params and "value" in params:
            return "{0} in ('{1}')".format(params["column"], "','".join(params["value"].split(",")))