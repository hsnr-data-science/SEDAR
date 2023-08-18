from database.data_access import dataset_data_access, workspace_data_access
from commons.models.dataset.models import DeequData

from requests import post
from werkzeug.exceptions import NotFound


def get(dataset_id, version):
    """
    Get stored deequ data for a dataset.

    :param dataset_id: id of datamart.
    """
    try:
        deequdata: DeequData = DeequData.objects(dataset_id=dataset_id, version=version)
    except:
        raise NotFound

    return deequdata.all()


def addProfiles(dataset_id, profiles, version):
    """
    Stores profiles in MongoDB. Case distinction if entry with
    dataset_id already exists or not.

    :param dataset_id: id of datamart to which profiles belong
    :param profiles: the profiles of deequ to be stored
    :return: The updated or unchanged entity.
    """
    try:      
        old_deequ_data_entity = get(dataset_id=dataset_id, version=version)
        try:
            if len(old_deequ_data_entity) == 0:  # just add the new entry
                entity = DeequData(dataset_id=dataset_id, version=version, profiles=profiles)
                entity.save()
                print("Deequ Data saved!")
                return entity
        except Exception as e:
            print(e)
        # update document in collection
        try:
            DeequData.objects(dataset_id=dataset_id, version=version).update(profiles=profiles)
            print("Deequ Data updated!")
        except Exception as e:
            print(e)

        return DeequData.objects(dataset_id=dataset_id, version=version).get()

    except Exception as e:
        print(e)

def addConstraintSuggestions(dataset_id, suggestions, version):
    """
    Stores constraint suggestions in MongoDB. Case distinction if entry with
    dataset_id already exists or not.

    :param dataset_id: id of datamart to which profiles belong
    :param suggestions: the suggestions of deequ to be stored
    :return: The updated or unchanged entity.
    """
    try:      
        old_deequ_data_entity = get(dataset_id=dataset_id, version=version)
        try:
            if len(old_deequ_data_entity) == 0:  # just add the new entry
                entity = DeequData(dataset_id=dataset_id, version=version, suggestions=suggestions)
                entity.save()
                print("Deequ Data saved!")
                return entity
        except Exception as e:
            print(e)
        # update document in collection
        try:
            DeequData.objects(dataset_id=dataset_id, version=version).update(suggestions=suggestions)
            print("Deequ Data updated!")
        except Exception as e:
            print(e)

        return DeequData.objects(dataset_id=dataset_id, version=version).get()

    except Exception as e:
        print(e)

def addValidationResult(dataset_id, validation_result, version):
    """
    Stores a constraint validation result in MongoDB. Case distinction if entry with
    dataset_id already exists or not.

    :param dataset_id: id of datamart to which validation_result belongs
    :param validation_result: the constraint validation result of deequ to be stored
    :return: The updated or unchanged entity.
    """
    try:      
        old_deequ_data_entity = get(dataset_id=dataset_id, version=version)
        try:
            if len(old_deequ_data_entity) == 0:  # just add the new entry
                entity = DeequData(dataset_id=dataset_id, version=version, validation_result=validation_result)
                entity.save()
                print("Deequ Data saved!")
                return entity
        except Exception as e:
            print(e)
        # update document in collection
        try:
            print(dataset_id)
            print(version)
            DeequData.objects(dataset_id=dataset_id, version=version).update(validation_result=validation_result)
            print("Deequ Data updated!")
        except Exception as e:
            print(e)

        return DeequData.objects(dataset_id=dataset_id, version=version).get()

    except Exception as e:
        print(e)


def delete(dataset_id, mode:str, version):
    """
    Deletes profiles, validation results or constraint suggestions of a datamart.

    :param dataset_id: id of datamart which.
    :param mode: 'profiles', 'validation_result' or 'suggestions'.
    :returns: updated entry.
    """
    entity = get(dataset_id, version)

    old_profiles = entity.get().profiles
    old_suggestions = entity.get().suggestions
    old_validation_result = entity.get().validation_result

    # update document in collection
    try:
        if mode == 'profiles':
            if old_profiles == {}:
                DeequData.objects(dataset_id=dataset_id, version=version).delete()
                return None
            else:
                DeequData.objects(dataset_id=dataset_id, version=version).update(profiles={})
                return DeequData.objects(dataset_id=dataset_id, version=version).all()
        elif mode == 'suggestions':
            if old_suggestions == {}:
                DeequData.objects(dataset_id=dataset_id, version=version).delete()
                return None
            else:
                DeequData.objects(dataset_id=dataset_id, version=version).update(suggestions={})
                return DeequData.objects(dataset_id=dataset_id, version=version).all()
        elif mode == 'validation_result':
            if old_validation_result == {}:
                print("here2")
                DeequData.objects(dataset_id=dataset_id, version=version).delete()
                return None
            else:
                print("here3")
                DeequData.objects(dataset_id=dataset_id, version=version).update(validation_result={})
                return DeequData.objects(dataset_id=dataset_id, version=version).all()
    except Exception as e:
        print(e)
