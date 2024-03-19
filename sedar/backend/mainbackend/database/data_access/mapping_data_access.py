from commons.models.dataset.models import Mapping
from werkzeug.exceptions import NotFound

#------------------------------------------------------------------------------------#
#CRUD
#------------------------------------------------------------------------------------#

def get_by_id(id) -> Mapping:
    """
    Returns a mapping or raise NotFound Exception based on passed name
    :param name:
    :return: mapping
    """
    mapping = Mapping.objects.filter(id=id)

    if not mapping:
        raise NotFound(f"Mapping with id: {id} not found")

    return mapping.get()


def get_list(workspace_id):
    """
    Returns a list of Mapping, filtered by page, limit and other params
    :return: List of Mappings
    """
    list = Mapping.objects.filter(workspace_id = workspace_id)
    return list


def add(workspace_id, name, mappings_file, description):
    try:
        mapping = Mapping(
            mappings_file=mappings_file,
            name=name,
            workspace_id=workspace_id,
            description=description
        )
        mapping.save()
        return mapping
    except Exception as e:
        print(e)

def update(workspace_id, mapping_id, name, mappings_file, description):
    try:
        mapping = get_by_id(mapping_id)
        mapping.update(
            mappings_file=mappings_file,
            name=name,
            workspace_id=workspace_id,
            description=description
        )
        mapping.save()
        return mapping
    except Exception as e:
        print(e)

def delete(workspace_id, mapping_id):
    """
    Delete mapping the entry in MongoDB.

    :param workspace_id: id of workspace in MongoDB and Fuseki.
    :param mapping_id: name of the graph.
    :return:
    """
    mapping = get_by_id(mapping_id)
    if not mapping:
        raise NotFound()
    if mapping.workspace_id != workspace_id:
        print(mapping.workspace_id)
        print(workspace_id)
        raise NotFound()
    mapping.delete()

