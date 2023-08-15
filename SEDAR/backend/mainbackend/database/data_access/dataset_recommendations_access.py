from database.data_access import dataset_data_access, workspace_data_access
from commons.models.dataset.models import Dataset, Attribute
from neomodel.match import INCOMING, Traversal

def get_links(entity, version, list, dataset_id, already_added_ids):
    try:
        attributes = entity.attributes.match(version=version)
        if len(attributes)!=0:
            for attr in attributes:
                if len(attr.foreign_key_to)!=0:
                    for fk in attr.foreign_key_to:
                        id = attr.foreign_key_to.relationship(fk).dataset_uid
                        if id!=dataset_id:
                            if id not in already_added_ids:
                                list.append({'data':dataset_data_access.get(id),'custom_description':None})
                                already_added_ids[id] = id
                t = Traversal(attr, attr.__label__, dict(node_class=Attribute, direction=INCOMING, relation_type='FK_TO')).all()
                if len(t)!=0:
                    for fk in t:
                        id = fk.foreign_key_to.relationship(attr).source_uid
                        if id!=dataset_id:
                            if id not in already_added_ids:
                                list.append({'data':dataset_data_access.get(id),'custom_description':None})
                                already_added_ids[id]=id
                list = get_links(attr, version, list, dataset_id, already_added_ids)
            return list
        else:
            return list
    except Exception as ex:
        return

def get(dataset_id:str, workspace_id:str) -> Dataset:
    """
    Get all recommened/linked datasets for the given dataset.

    :param dataset_id: id of the dataset.
    :param workspace_id: id of the workspace.
    :returns: datasets that are linked to the dataset.
    """
    links = []
    dataset = dataset_data_access.get(dataset_id)
    if dataset.schema[0].type!='UNSTRUCTURED':
        links = get_links(dataset.schema[0].entities[0], dataset.current_version_of_schema, links, dataset.uid, {})
    if len(dataset.custom_link)!=0:
        for link in dataset.custom_link:
            links.append({'data':link,'custom_description':dataset.custom_link.relationship(link).description})
    t = Traversal(dataset, dataset.__label__, dict(node_class=Dataset, direction=INCOMING, relation_type='HAS_CUSTOM_LINK')).all()
    if len(t)!=0:
        for ds in t: 
            links.append({'data':ds,'custom_description':ds.custom_link.relationship(dataset).description})
    already_added_ids={}
    if len(dataset.lineage)!=0:
        for ds in dataset.lineage:
            if ds.uid not in already_added_ids:
                links.append({'data':ds,'custom_description':'_LINEAGE_'})
                already_added_ids[ds.uid]=ds.uid
    t = Traversal(dataset, dataset.__label__, dict(node_class=Dataset, direction=INCOMING, relation_type='HAS_LINEAGE')).all()
    if len(t)!=0:
        workspace = workspace_data_access.get(workspace_id)
        for ds in t:
            if ds.uid not in already_added_ids:
                rel = workspace.datasets.relationship(ds)
                if rel.is_published==True:
                    links.append({'data':ds,'custom_description':'_LINEAGE_'})
                    already_added_ids[ds.uid]=ds.uid
    return links

def post(dataset_id:str, id_of_linked_dataset:str, description:str, workspace_id:str) -> Dataset:
    """
    Function to link a dataset.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param id_of_linked_dataset: id of the dataset that should be linked.
    :param description: description of the link.
    :param workspace_id: id of the workspace.
    :returns: dataset.
    """
    dataset = dataset_data_access.get(dataset_id)
    dataset_for_linkage = dataset_data_access.get(id_of_linked_dataset)
    dataset.custom_link.connect(dataset_for_linkage, {'description':description})
    return get(dataset_id, workspace_id)


def put(dataset_id:str, id_of_linked_dataset:str, description:str, workspace_id:str) -> Dataset:
    """
    Function to update the link to a dataset.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param id_of_linked_dataset: id of the dataset that should be linked.
    :param description: description of the link.
    :param workspace_id: id of the workspace.
    :returns: dataset.
    """
    dataset = dataset_data_access.get(dataset_id)
    dataset_for_linkage = dataset_data_access.get(id_of_linked_dataset)
    rel = dataset.custom_link.relationship(dataset_for_linkage)
    rel2 = dataset_for_linkage.custom_link.relationship(dataset)
    if rel == None and rel2 != None:
        rel2.description = description
        rel2.save()
    else:
        rel.description = description
        rel.save()
    return get(dataset_id, workspace_id)

def delete(dataset_id:str, id_of_linked_dataset:str, workspace_id:str) -> Dataset:
    """
    Function to unlink a dataset.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param id_of_linked_dataset: id of the dataset that should be linked.
    :param workspace_id: id of the workspace.
    :returns: dataset.
    """
    dataset = dataset_data_access.get(dataset_id)
    dataset_for_linkage = dataset_data_access.get(id_of_linked_dataset)
    rel = dataset.custom_link.relationship(dataset_for_linkage)
    rel2 = dataset_for_linkage.custom_link.relationship(dataset)
    if rel != None:
        dataset.custom_link.disconnect(dataset_for_linkage)
    if rel2 != None:
        dataset_for_linkage.custom_link.disconnect(dataset)
    return get(dataset_id, workspace_id)