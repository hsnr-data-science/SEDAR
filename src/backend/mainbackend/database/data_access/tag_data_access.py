from neomodel.match import INCOMING, Traversal
from werkzeug.exceptions import NotFound
from database.data_access import ontology_data_access, workspace_data_access, dataset_data_access
from commons.models.dataset.models import Annotation, Dataset, Tag

def get(tag_id:str) -> Tag:
    """
    Helper function to return a given tag.

    :tag_id: if of the tag.
    :returns: the given tag.
    """
    tag = Tag.nodes.get_or_none(uid=tag_id)

    if not tag:
        raise NotFound(f"Tag with id {tag_id} not found")

    return tag

def get_all(workspace_id:str) -> [Tag]:
    """
    Helper function to return all tags in a workspace.

    :workspace_id: to filter for tags in this workspace.
    :returns: all tags in the given workspace.
    """
    return workspace_data_access.get(workspace_id).tags


def create(workspace_id:str, dataset_id:str, title:str, annotation:str, ontology_id:str, tag_id:str)  -> Tag:
    """
    Create a new tag.

    :param workspace_id: the id of the current workspace.
    :param dataset_id: the id of the current dataset.
    :param title: title of the new tag.
    :param annotation: annotation string.
    :param ontology_id: id of the coressponding ontology.
    :param tag_id: id of a existing tag.
    :returns: newly created tag object or existing tag object.
    """
    dataset = dataset_data_access.get(dataset_id)
    if tag_id!=None:
        entity = get(tag_id)
        dataset.tags.connect(entity)
        return entity
    workspace = workspace_data_access.get(workspace_id)
    ontology = ontology_data_access.get(ontology_id)
    entity =  workspace.tags.get_or_none(title__exact=title)
    if entity:
        if entity.annotation.get_or_none(instance__exact=annotation):
            return entity
    entity = Tag(title=title.lower())
    entity.save()
    an = Annotation(instance=annotation)
    an.save()
    entity.annotation.connect(an)
    an.ontology.connect(ontology)
    dataset.tags.connect(entity)
    workspace.tags.connect(entity)

    #find similar tagged nodes
    for item in Annotation.nodes.filter(instance__exact=an.instance):
        if item.uid != an.uid and item.ontology[0].uid == an.ontology[0].uid:
            t = Traversal(item, item.__label__, dict(node_class=Tag, direction=INCOMING, relation_type='HAS_ANNOTATION')).all()
            if(len(t)>0):
                entity.linked.connect(t[0])
                t[0].linked.connect(entity)
    return entity

def delete(workspace_id:str, dataset_id:str, tag_id:str) -> None:
    """
    Deletes or unconnects a tag from a dataset.
    If the tag was only used in this specific dataset, it will be removed completey from the database. 

    :workspace_id: id of workspace.
    :dataset_id: id of dataset.
    :tag_id: id of tag.
    :returns: None
    """
    entity = get(tag_id)
    dataset = dataset_data_access.get(dataset_id)
    dataset.tags.disconnect(entity)
    if len(Traversal(entity, entity.__label__, dict(node_class=Dataset, direction=INCOMING, relation_type='HAS_TAG')).all())==0:
        workspace = workspace_data_access.get(workspace_id)
        workspace.tags.disconnect(entity)
        annotation = entity.annotation.get_or_none()
        if annotation:
            annotation.delete()
        entity.delete()
    return 
