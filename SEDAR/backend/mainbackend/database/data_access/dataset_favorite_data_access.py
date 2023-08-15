from database.data_access import user_data_access, workspace_data_access, dataset_data_access
from commons.models.dataset.models import Dataset

def get_all(workspace_id:str, user_id:str) -> [Dataset]:
    """
    Helper function to return all dataset marked as favorite in a workspace.

    :workspace_id: id of the workspace.
    :user_id: id of the user who has favorite datasets.
    :returns: all datasets marked as favorite.
    """
    fav = []
    workspace = workspace_data_access.get(workspace_id)
    user = user_data_access.get(user_id)
    favorites = user.favorites
    if not favorites:
        return fav
    else:
        for f in favorites:
            if workspace.datasets.get_or_none(uid__exact=f.uid):
                fav.append(f)
    return fav


def patch(dataset_id:str, user_id:str)  -> None:
    """
    Patch function for adding or removing a connection between a given user and a dataset as favorite. 

    :param dataset_id: the id of the dataset.
    :param user_id: the id of the dataset.
    :returns: None
    """
    dataset = dataset_data_access.get(dataset_id)
    user = user_data_access.get(user_id)
    rel = user.favorites.relationship(dataset)
    if rel:
        user.favorites.disconnect(dataset)
    else:
        user.favorites.connect(dataset)
    return 
