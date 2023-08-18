from werkzeug.exceptions import NotFound
from database.data_access import user_data_access, dataset_data_access
from commons.models.dataset.models import Log, Logs, Change

def get(dataset_id:str) -> Log:
    """
    Get latest logs.

    :param dataset_id: id of dataset.
    :returns: a dataset.
    """
    ds = Logs.objects(dataset=dataset_id).first()

    if not ds:
        raise NotFound(f"Logs for dataset with id {dataset_id} not found")

    return ds

def get_diffs(a, b, keys=None) -> Log:
    """
    Get diff between two dicts.

    :param a: dict a.
    :param b: dict b.
    :param keys: list of keys.
    :returns: list of changes.
    """
    changes = []

    if keys != None:
        for key in keys:
            try:
                if a[key] != b[key]:
                    changes.append(Change(key=key, changed_from=str(a[key]), changed_to=str(b[key])))
            except:
                pass
    else:
        for key in a:
            try:
                if a[key] != b[key]:
                    changes.append(Change(key=key, changed_from=str(a[key]), changed_to=str(b[key])))
            except:
                pass
    return changes

def create(dataset_id:str, description:dict, type:str, user_id:str, changes=[]) -> Log:
    """
    Function to create a log with the given informations.

    :param dataset_id: id of the dataset.
    :param title: title for the interaction.
    :param description: dict with all description with language key.
    :param type: type of log.
    :param user_id: id of the user that interacted with the dataset.
    :returns: a dataset.
    """
    try:
        ds = get(dataset_id)
    except Exception as ex:
        ds = Logs(dataset=dataset_id)
        ds.save()
    log = Log(description=description, type=type, user=user_data_access.get(user_id).email, version=dataset_data_access.get(dataset_id).current_version_of_schema)
    if len(changes)!=0:
        for change in changes:
            log.changes.append(change)
    ds.logs.append(log)
    ds.save()
    return 