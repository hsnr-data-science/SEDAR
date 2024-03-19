from endpoints.v1.misc import delete_sourcedata_from_index
from database.data_access import dataset_data_access, user_data_access
from commons.models.dataset.models import User

def set_status(dataset_id:str, user_id:str, workspace_id:str) -> [User]:
    """
    Helper function to set the status the dataset.

    :param dataset_id: if of the dataset.
    :param user_id: id of current user.
    :param dataset_id: id of workspace.
    :returns: the current user of the workspace or a empty list
    """
    dataset = dataset_data_access.get(dataset_id)
    dataset.is_public = not dataset.is_public
    dataset.save()
    if dataset.is_public == True:
        for user in dataset.users:
            dataset.users.disconnect(user)
        return []
    else:
        user = user_data_access.get(user_id)
        owner = dataset.owner.get()
        dataset.users.connect(owner, {'can_read':True, 'can_write':True, 'can_delete':True})
        if owner.email != user.email:
            dataset.users.connect(user, {'can_read':True, 'can_write':True, 'can_delete':True})
        delete_sourcedata_from_index(workspace_id, dataset_id)
        return [item.serialize() for item in dataset.users]


def add_user(dataset_id:str, email:str, add:bool, can_read:bool, can_write:bool, can_delete:bool)  -> User:
    """
    Helper function to add a user to the dataset.

    :param dataset_id: if of the dataset.
    :param email: id of the user who should be added.
    :param add: defines it the user should be added, deleted or the relationship should be updated.
    :param can_read: defines wether the user can read or not.
    :param can_write: defines wether the user can write or not.
    :param can_delete: defines wether the user can delete or not.
    :returns: the current user of the workspace or a empty list
    """
    dataset = dataset_data_access.get(dataset_id)
    user = user_data_access.get(email)
    if add == True:
        dataset.users.connect(user, {'can_read':can_read, 'can_write':can_write, 'can_delete':can_delete})
    elif add == False:
        dataset.users.disconnect(user)
        return user.serialize()
    else:
        rel = dataset.users.relationship(user)
        rel.can_read=can_read;
        rel.can_write=can_write;
        rel.can_delete=can_delete;
        rel.save()
    return user.serialize(dataset=dataset)