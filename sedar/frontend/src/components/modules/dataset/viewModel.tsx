import { action, IObservableArray, makeObservable, observable } from 'mobx'
import React from 'react'
// @ts-ignore  
// import { RawNodeDatum } from "react-d3-tree/lib/types/";
//weird errors
export interface RawNodeDatum {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  children?: RawNodeDatum[];
}
//weird errors
import ContentStore from '../../../models/contentStore'
import { IDataset, ILog, INotebook, ITag } from '../../../models/dataset'
import { IDatasource } from '../../../models/datasource'
import StoreStatus from '../../../models/storeStatus.enum'
import { IUser } from '../../../models/user'
import routingStore from '../../../stores/routing.store'
import workspacesStore from '../../../stores/workspaces.store'
import View from './main.component'
import uuid from 'react-uuid'
import { IFileUpload } from '../../../models/fileUpload'
import { IPreview } from '../../../models/preview'
import { IAnnotation, IAttribute } from '../../../models/schema'
import { AutocompleteItem } from '../../../models/autocomplete'
import searchStore from '../../../stores/search.store'
import { t } from 'i18next'
import appStore from "../../../stores/app.store";
import { allowStateReadsStart } from 'mobx/dist/internal'
import { toJS } from 'mobx'




/**
* ViewModel for the dataset view.
*/
class ViewModel extends ContentStore {

  /*
  ------------------------------------------------------------------
  General
  ------------------------------------------------------------------
  */

  @observable tab: number = 0;
  @observable sessionId: string = uuid() as string;
  @observable profilingIsRunning: boolean = false;
  @observable canNotRunProfiling: boolean = false;
  @observable isRunningUpdate: boolean = false;
  private refreshIntervalId: number | null = null;
  @observable tagOntologyProperty: AutocompleteItem | null = null;

  @action setTagOntologyProperty(newValue: AutocompleteItem | null) {
    this.tagOntologyProperty = newValue;
  }

  /*
  ------------------------------------------------------------------
  General Tab
  ------------------------------------------------------------------
  */

  @observable generalPreview: IPreview = undefined;
  @observable tag: ITag = {} as ITag;
  @observable dataset: IDataset = undefined;
  @observable sizeOfFiles: number = 0;
  recommendations: IObservableArray<IDataset>;
  logs: IObservableArray<ILog>;

  /*
  ------------------------------------------------------------------
  History Tab
  ------------------------------------------------------------------
  */

  @observable datasourceDefinition: string = '';
  @observable isUpdateFor: boolean = false;
  data: IFileUpload[];
  plugin: IFileUpload[];

  /*
  ------------------------------------------------------------------
  Lineage Tab
  ------------------------------------------------------------------
  */

  @observable lineage: RawNodeDatum = undefined;

  /*
  ------------------------------------------------------------------
  Visualization Tab
  ------------------------------------------------------------------
  */

  @observable notebook: INotebook = {
    title:'',
    description:'',
    isPublic:false,
    type:'JUPYTER',
  } as INotebook;
  @observable wiki: string = "";

  /*
  ------------------------------------------------------------------
  Option Tab
  ------------------------------------------------------------------
  */

  users: IObservableArray<IUser>;

  /*
  ------------------------------------------------------------------
  Profile Tab
  ------------------------------------------------------------------
  */

  @observable idOfFkDataset: string = '';
  @observable idOfFkAttribute: string = '';
  @observable fkAttribute: string = '';
  @observable openFkDialog: boolean = false;
  @observable setPk: boolean = false;
  @observable fkDataset: IDataset = undefined;
  @observable openCustomAnnotationDialog = false;
  @observable selectedEntityForCustomAnnotation = '';
  @observable validation_results: string = '';
  fkColumns: IObservableArray<{}>;

  /*
  ------------------------------------------------------------------
  Query Tab
  ------------------------------------------------------------------
  */

  @observable simpleView: boolean = true;
  @observable disabled: boolean;
  @observable selectColumn: string;
  @observable selectAggregation: string;
  @observable filterColumn: string;
  @observable groupByColumn: string;
  @observable orderByColumn: string;
  @observable filterOperator: string;
  @observable filterValueOne: string;
  @observable filterValueTwo: string;
  @observable selectedAggregateColumn: string;
  @observable limit: string;
  @observable sortDirection: string;
  @observable craftedQuery: string;
  @observable queryPreview: IPreview = undefined;
  columns: IObservableArray<string>;
  columnsToFilter: IObservableArray<string>;
  columnsToGroupBy: IObservableArray<string>;
  columnsToOrderBy: IObservableArray<string>;
  columnsToSelect: IObservableArray<string>;


  /*
  ------------------------------------------------------------------
  Deequ
  ------------------------------------------------------------------
  */
  @observable constraintbool: boolean = false;
  @observable constraints: string | null = null;

  /*
  ------------------------------------------------------------------
  Init
  ------------------------------------------------------------------
  */

  constructor() {
    super()
    makeObservable(this)
    this.initialize();
  }

  async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
      this.users = observable.array([]);
      this.columns = observable.array([]);
      this.fkColumns = observable.array([]);
      this.columnsToFilter = observable.array([]);
      this.columnsToGroupBy = observable.array([]);
      this.columnsToOrderBy = observable.array([]);
      this.columnsToSelect = observable.array([]);
      this.recommendations = observable.array([]);
      this.logs = observable.array([]);
      this.limit = '10';
      this.craftedQuery = '';
      this.disabled = true;
      this.selectColumn = '*';
      this.selectAggregation = '';
      this.filterColumn = '';
      this.filterOperator = '';
      this.filterValueOne = '';
      this.filterValueTwo = undefined;
      this.groupByColumn = '';
      this.orderByColumn = '';
      this.sortDirection = '';
      this.setStatus(StoreStatus.ready);
      this.getDataset();
      this.getRecommendations();
      this.getLogs();
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
      routingStore.history.push('/');
    }
  }

  /* 
  ------------------------------------------------------------------
  General
  ------------------------------------------------------------------
  */

  /**
  * Function for setting or unsetting a dataset as favorite.
  */
  async setOrUnsetFavorite() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/favorite`,
        {
          method: "PATCH",
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      if (this.dataset.isFavorite) {
        this.dataset.isFavorite = false;
        workspacesStore.favorites.remove(workspacesStore.favorites.find((d) => d.id == this.dataset.id));
      }
      else {
        this.dataset.isFavorite = true;
        workspacesStore.favorites.push(this.dataset);
      }
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /*
  ------------------------------------------------------------------
  General Tab
  ------------------------------------------------------------------
  */

  /**
  * Function for downloading the logs as a file.
  * @param {string} language language code for the description.
  */
  public async downloadLogs(language: string) {
    //https://pretagteam.com/question/materialui-how-to-download-a-file-when-clicking-a-button
    try {
      const response = await fetch(`${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/logs?is_download=True&language=${language}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
        credentials: 'include',
      })
        .then((response) => response.blob())
        .then((blob) => {
          // Create blob link to download
          const url = window.URL.createObjectURL(
            new Blob([blob]),
          );
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            'logs_' + this.dataset.id + '.json',
          );

          // Append to html link element page
          document.body.appendChild(link);

          // Start download
          link.click();

          // Clean up and remove the link
          link.parentNode.removeChild(link);
        });
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for getting all logs.
  */
  async getLogs() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${routingStore.location.pathname.split('/')[2]}/logs`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.logs.replace(json as ILog[]);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for removing a dataset from the recommendations.
  * @param {string} id id of the dataset that should added.
  */
  async deleteRecommendation(id: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/recommendations`,
        {
          method: "DELETE",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_of_linked_dataset: id,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.recommendations.replace(json as IDataset[])
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for adding a dataset to show in the recommendations.
  * @param {string} id id of the dataset that should added.
  * @param {string} description short description why the datasets should be linked.
  */
  async postRecommendation(id: string, description: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/recommendations`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_of_linked_dataset: id,
            description: description,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.recommendations.replace(json as IDataset[])
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for updating the description of a dataset shown in the recommendations.
  * @param {string} id id of the dataset that should added.
  * @param {string} description short description why the datasets should be linked.
  */
  async putRecommendation(id: string, description: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/recommendations`,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_of_linked_dataset: id,
            description: description,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.recommendations.replace(json as IDataset[])
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for editing the basic informations of the dataset.
  * @param {string} description description of the dataset.
  * @param {string} title title of the dataset.
  * @param {string} author author of the dataset.
  * @param {string} license license of the dataset.
  * @param {string} language language of the dataset.
  * @param {string} latitude latitude of the dataset.
  * @param {string} longitude longitude of the dataset.
  * @param {string} rangeStart rangeStart of the dataset.
  * @param {string} rangeEnd rangeEnd of the dataset.
  */
  async putDataset(description: string = this.dataset.description, title: string = this.dataset.title, author: string = this.dataset.author, license: string = this.dataset.license,
    language: string = this.dataset.language, latitude: string = this.dataset.latitude,
    longitude: string = this.dataset.longitude, rangeStart: Date = this.dataset.rangeStart,
    rangeEnd: Date = this.dataset.rangeEnd) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}`,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            description: description,
            author: author,
            license: license,
            language: language,
            latitude: latitude,
            longitude: longitude,
            range_start: rangeStart,
            range_end: rangeEnd,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      this.dataset.author = author;
      this.dataset.language = language;
      this.dataset.longitude = longitude;
      this.dataset.latitude = latitude;
      this.dataset.rangeStart = rangeStart;
      this.dataset.rangeEnd = rangeEnd;
      if (this.dataset.title != title) {
        this.dataset.title = title
        if (workspacesStore.favorites.find((d) => d.id == this.dataset.id) != undefined) {
          workspacesStore.favorites.remove(workspacesStore.favorites.find((d) => d.id == this.dataset.id));
          workspacesStore.favorites.push(this.dataset);
        }
      }
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for getting all linked datasets for the recommendations.
  */
  async getRecommendations() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${routingStore.location.pathname.split('/')[2]}/recommendations`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.recommendations.replace(json as IDataset[]);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for getting the schema of the dataset.
  */
  async getDatasetSchema() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}?schema_only=True`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      let ds = json as IDataset;
      this.dataset.schema = ds.schema;
      if (this.dataset.schema.type == 'UNSTRUCTURED') {
        this.dataset.schema.files.forEach(file => {
          this.sizeOfFiles = this.sizeOfFiles + file.sizeInBytes;
        })
      } else {
        if (this.columns.length == 0) {
          this.dataset.schema.entities.forEach(element => {
            this.getColumns(element.attributes, '')
          })
        }
      }
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for getting the basic dataset.
  */
  async getDataset() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${routingStore.location.pathname.split('/')[2]}?schema_only=False`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.dataset = json as IDataset;
      this.getDatasetSchema();
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for getting the sourcedata of the dataset.
  */
  async getSourcedata() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/preview?session_id=${this.sessionId}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.generalPreview = json as IPreview;
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for adding a tag to the dataset.
  */
  async postTag() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/tags`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: this.tag.title,
            annotation: this.tagOntologyProperty.value,
            ontology_id: this.tagOntologyProperty.graph
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const tag = (await response.json());
      this.dataset.tags.push(tag as ITag);
      /*if(searchStore.tags.find((t)=>t.id==tag.id)==undefined){
        searchStore.tags.push(tag)
      }*/
      searchStore.getTags();
      if (workspacesStore.favorites.find((d) => d.id == this.dataset.id) != undefined) {
        workspacesStore.favorites.remove(workspacesStore.favorites.find((d) => d.id == this.dataset.id));
        workspacesStore.favorites.push(this.dataset);
      }
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for deleting a tag from the dataset.
  */
  async deleteTag(tagId: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/tags/${tagId}`,
        {
          method: "DELETE",
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      let t = this.dataset.tags as IObservableArray<ITag>;
      t.remove(this.dataset.tags.find((item) => item.id == tagId));
      searchStore.getTags();
      if (workspacesStore.favorites.find((d) => d.id == this.dataset.id) != undefined) {
        workspacesStore.favorites.remove(workspacesStore.favorites.find((d) => d.id == this.dataset.id));
        workspacesStore.favorites.push(this.dataset);
      }
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /*
  ------------------------------------------------------------------
  Lineage Tab
  ------------------------------------------------------------------
  */

  /**
  * Function for getting the lineage of the dataset.
  * The returned format is directly usable for the d3 tree.
  */
  async getLineage() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/lineage`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      var lineage = (await response.json())
      this.lineage = lineage as RawNodeDatum;
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /*
  ------------------------------------------------------------------
  Profile Tab
  ------------------------------------------------------------------
  */

  /**
  * Function for getting the possible fk columns and insert them into a list.
  * @param {IAttribute} attributes list of all attributes.
  * @param {string} prefix correct prefix if nested.
  */
  getColumnsFK(attributes: IAttribute[], prefix: string) {
    attributes.forEach(element => {
      if (element.isObject) {
        this.getColumnsFK(element.attributes, prefix + element.name + '.');
      }
      else if (element.isArrayOfObjects) {
        this.getColumnsFK(element.attributes, prefix + element.name + (element.attributes.length > 0 ? '[0].' : '[0]'));
      }
      else {
        this.fkColumns.push({ 'id': element.id, 'name': prefix + element.name });
      }
    });
  }

  /**
  * Function for getting the schema of the chosen fk dataset.
  */
  async getFKDataset() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.idOfFkDataset}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.fkDataset = json as IDataset;
      this.fkDataset?.schema?.entities.forEach((e) =>
        this.getColumnsFK(e.attributes, '')
      )
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for editing the attribute of the schema.
  * @param {string} attribute_id id of the attribute.
  * @param {string} description description of the attribute.
  * @param {string} datatype datatype of the attribute.
  * @param {boolean} isPk defines whether the attribute is a primary key or not.
  * @param {boolean} isFk defines whether the attribute is a foreign key or not.
  * @param {boolean} containsPII defines whether the attribute contains personally identifiable information or not.
  * * @param {boolean} isNullable defines whether the attribute nullable or not.
  */
  async putAttribute(attribute_id: string, description: string, datatype: string, isPk: boolean, isFk: boolean, containsPII: boolean, isNullable: boolean) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/attributes/${attribute_id}`,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description,
            datatype: datatype,
            is_pk: isPk,
            is_fk: isFk,
            contains_PII: containsPII,
            is_nullable: isNullable,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for setting the attribute to the schema.
  * @param {IAttribute} attributes list of all attributes.
  * @param {string} prefix correct prefix if nested.
  * @param {IAttribute} attribute attribute that should be edited.
  */
  setFK(attributes: IAttribute[], prefix: string, attribute: IAttribute) {
    attributes.forEach(element => {
      if (element.isObject) {
        this.setFK(element.attributes, prefix + element.name + '.', attribute);
      }
      else if (element.isArrayOfObjects) {
        this.setFK(element.attributes, prefix + element.name + (element.attributes.length > 0 ? '[0].' : '[0]'), attribute);
      }
      else {
        if (element.id == attribute.id) {
          if (element.foreignKeysTo == undefined) {
            element.isFk = true;
            element.foreignKeysTo = attribute.foreignKeysTo;
          }
          else {
            element.foreignKeysTo = attribute.foreignKeysTo;
          }
          return
        }
      }
    });
  }

  /**
  * Function for patching a attribute with semantic informations.
  * @param {AutocompleteItem} attributeOntologyProperty item that was created while searching for a annotations.
  * it holds a necessary informations.
  * @param {string} annotationToDelete id of the annotation that should be deleted.
  */
  async patchAttribute(attributeOntologyProperty: AutocompleteItem = undefined, annotationToDelete: string = undefined) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/attributes/${this.fkAttribute}`,
        {
          method: "PATCH",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annotation_id: annotationToDelete == '' ? undefined : annotationToDelete,
            annotation: attributeOntologyProperty?.value,
            ontology_id: attributeOntologyProperty?.graph,
            id_of_fk_dataset: this.idOfFkDataset,
            id_of_fk_attribute: this.idOfFkAttribute,
            set_pk: this.setPk,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      if (attributeOntologyProperty != undefined || annotationToDelete != undefined) {
        const json = (await response.json())
        return json
      } else {
        const json = (await response.json())
        this.dataset?.schema?.entities?.forEach((e) =>
          this.setFK(e.attributes, '', json as IAttribute)
        )
        this.getRecommendations();
      }
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for downloading a file from the hdfs.
  * @param {string} id id of the file.
  * @param {string} filename name of the file.
  */
  public async downloadFile(id: string, filename: string) {
    //https://pretagteam.com/question/materialui-how-to-download-a-file-when-clicking-a-button
    try {
      const response = await fetch(`${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/files/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
        credentials: 'include',
      })
        .then((response) => response.blob())
        .then((blob) => {
          // Create blob link to download
          const url = window.URL.createObjectURL(
            new Blob([blob]),
          );
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            filename,
          );

          // Append to html link element page
          document.body.appendChild(link);

          // Start download
          link.click();

          // Clean up and remove the link
          link.parentNode.removeChild(link);
        });
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for editing a file.
  * @param {string} id id of the file.
  * @param {string} description description of the file.
  */
  async putFile(id: string, description: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/files/${id}`,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for patching a file and add semantic annotations.
  * @param {string} description description for the annotation.
  * @param {string} key key for the annotation, this might be for example a timestamp.
  * @param {AutocompleteItem} attributeOntologyProperty item that was created while searching for a annotations.
  * it holds a necessary informations.
  * @param {string} annotationId id of the annotation that should be deleted.
  */
  async patchFile(description: string, key: string, attributeOntologyProperty: AutocompleteItem, annotationId: string = null) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/files/${this.selectedEntityForCustomAnnotation}`,
        {
          method: "PATCH",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description,
            key: key,
            annotation: attributeOntologyProperty?.value,
            ontology_id: attributeOntologyProperty?.graph,
            annotation_id: annotationId,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      if (key == undefined) {
        const json = (await response.json());
        return json;
      }
      else {
        if (annotationId != null) {
          this.dataset.schema.files.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation = this.dataset.schema.files.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation.filter((a) => a.id != annotationId)
        } else {
          const json = (await response.json() as IAnnotation)
          if (this.dataset.schema.files.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation == undefined) {
            this.dataset.schema.files.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation = []
          }
          this.dataset.schema.files.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation.push(json)
        }
      }
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for editing a entity.
  * @param {string} id id of the entity.
  * @param {string} description description of the entity.
  * @param {string} name displaynem for the entity.
  */
  async putEntity(id: string, description: string, name: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/entities/${id}`,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description,
            name: name,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for patching a entity and add semantic annotations.
  * @param {string} description description for the annotation.
  * @param {string} key key for the annotation, this might be for example a timestamp.
  * @param {AutocompleteItem} attributeOntologyProperty item that was created while searching for a annotations.
  * it holds a necessary informations.
  * @param {string} annotationId id of the annotation that should be deleted.
  */
  async patchEntity(description: string, key: string, attributeOntologyProperty: AutocompleteItem, annotationId: string = null) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/entities/${this.selectedEntityForCustomAnnotation}`,
        {
          method: "PATCH",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description,
            key: key,
            annotation: attributeOntologyProperty?.value,
            ontology_id: attributeOntologyProperty?.graph,
            annotation_id: annotationId,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      if (key == undefined) {
        const json = (await response.json())
        return json
      }
      else {
        if (annotationId != null) {
          this.dataset.schema.entities.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation = this.dataset.schema.entities.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation.filter((a) => a.id != annotationId)
        } else {
          const json = (await response.json() as IAnnotation)
          if (this.dataset.schema.entities.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation == undefined) {
            this.dataset.schema.entities.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation = []
          }
          this.dataset.schema.entities.find((e) => e.id == this.selectedEntityForCustomAnnotation).customAnnotation.push(json)
        }
      }
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for starting the profiling.
  */
  async getProfiling(version:string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/profiling?session_id=${this.sessionId}&version=${version}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      this.profilingIsRunning = true;
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }


  /*
  ------------------------------------------------------------------
  Visualization Tab
  ------------------------------------------------------------------
  */

    /**
  * Function for adding a Notebook to the HDFS
  */
    async addNotebookToHDFS(item: INotebook){

      try {
        const response = await fetch(
          process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/jupyterhub/addNotebookToHDFS`,
          {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspace_id: workspacesStore.currentWorkspace.id,
              session_id: this.sessionId,
              dataset_id: this.dataset.id,
              item_id: item.id,
              username: item.author.username,      
            }),
            credentials: 'include',
          }
        );
  
  
      if (!response.ok) throw new Error(response.statusText);
      const erg = (await response.json())           
      } catch (ex) {
      this.setStatus(StoreStatus.failed);
      }
  
  
  
    }
  
    /**
    * Function for adding a public notebook from the hdfs to the container of the user
    */
    async copyNbFromHDFStoContainer(username: string,item_id:string){
      try {
        const response = await fetch(
          process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/jupyterhub/copyNbFromHDFStoContainer`,
          {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspace_id: workspacesStore.currentWorkspace.id,
              session_id: this.sessionId,
              dataset_id: this.dataset.id,
              item_id: item_id,
              username: username,
              
            }),
            credentials: 'include',
          }
        );
  
  
      if (!response.ok) throw new Error(response.statusText);
      const erg = (await response.json())           
  
      } catch (ex) {
      this.setStatus(StoreStatus.failed);
      }
    }
  
    /**
    * Function for prepating the run tab. Needed when a link to an with a notebook associated run is clicked.
    */
    async prepareRuns(experiment_id:string){
      try {
        const response = await fetch(
          `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/mlflow/${workspacesStore.currentWorkspace.id}/datasets`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = (await response.json())
        appStore.allDatasets = json;
  
      } catch (ex) {
        this.setStatus(StoreStatus.failed);
      }
      try {
        const response = await fetch(
          `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/mlflow/${workspacesStore.currentWorkspace.id}/imagedatasets`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = (await response.json())
        appStore.imageDatasets = json;
   
      } catch (ex) {
        this.setStatus(StoreStatus.failed);
      }
      try {
        const response = await fetch(
          `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/mlflow/${workspacesStore.currentWorkspace.id}/tabledatasets`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = (await response.json())
        appStore.tableDatasets = json;
      } catch (ex) {
        this.setStatus(StoreStatus.failed);
      }
      try {
        const response = await fetch(
          
          process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/mlflow/searchRuns`,
          {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              experiment_id: experiment_id
            }),
            credentials: 'include',
          }
        );
  
  
      if (!response.ok) throw new Error(response.statusText);
      const runs = (await response.json())
      appStore.runs = JSON.stringify(runs);
      if((await response.json())){
        return true;
      }
      } catch (ex) {
      this.setStatus(StoreStatus.failed);
      }
  
  
    }

  /**
  * Function for getting the wiki.
  * @param {string} lang chosen language for getting the correct wiki.
  */
  async getWiki(lang: string) {
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + '/wiki/' + lang,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.wiki = json['markdown'];
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for getting the notebooks.
  */
  async getNotebooks() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/notebooks`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const notebooks = (await response.json())
      this.dataset.notebooks = observable.array(notebooks as INotebook[]);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for adding a notebook.
  */
  async postNotebook() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/notebooks`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: this.notebook.title,
            description: this.notebook.description,
            type: "JUPYTER",
            is_public: this.notebook.isPublic,
            version: this.notebook.version,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json());
      this.dataset.notebooks.push(json as INotebook);
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for editing a notebook.
  * @param {string} id id of the notebook.
  * @param {string} title short title for the notebook.
  * @param {string} description short description.
  * @param {boolean} isPublic defines whether the notebooks is visibile for all other users or not.
  * @param {string} version dataset version that is used.
  */
  async putNotebook(id: string, title: string, description: string, isPublic: boolean, version: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/notebooks/${id}`,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            description: description,
            is_public: isPublic,
            version: version,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json()) as INotebook;
      let cN = this.dataset.notebooks.find((item) => item.id == id);
      cN.title = json.title;
      cN.description = json.description;
      cN.isPublic = json.isPublic;
      cN.version = json.version;
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for deleting a notebook.
  * @param {string} id id of the notebook that should be deleted.
  */
  async deleteNotebook(id: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/notebooks/${id}`,
        {
          method: "DELETE",
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      let notebooks = this.dataset.notebooks as IObservableArray<INotebook>;
      notebooks.remove(this.dataset.notebooks.find((item) => item.id == id));
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /*
  ------------------------------------------------------------------
  History Tab
  ------------------------------------------------------------------
  */

  /**
  * Function for updating the continuation timer.
  * @param {string[]} timer new continuation timer.
  */
  async putContinuationTimer(timer: string[]) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/timer`,
        {
          method: "PUT",
          credentials: 'include',
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timer: timer,
          }),
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      return
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for getting the deltas between two given versions a notebook.
  * @param {string} version source version.
  * @param {string} versionToCompare version for the comparing.
  */
  async getDeltas(version: string, versionToCompare: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/deltas?session_id=${this.sessionId}&version=${version}&version_to_compare=${versionToCompare}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const deltas = (await response.json())
      return deltas
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for starting the ingestion of a update.
  */
  @action  async runIngestion() {
    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/run-ingestion`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json());
    this.dataset.datasource = json as IDatasource;
    this.isRunningUpdate = true;
  }

  /**
  * Function for deregister the hook on exit.
  */
  public deregisterIntevals() {
    if (this.refreshIntervalId !== null)
      window.clearInterval(this.refreshIntervalId);
    this.refreshIntervalId = null;
  }

  /**
  * Function to register a hook to refresh the list of logs and the datasource
  * every 30 seconds. Is also requried for profiling and updates.
  * This function will be called by effect, to register the hook.
  */
  public registerIntevals() {
    this.deregisterIntevals();
    this.refreshIntervalId = window.setInterval(
      this.getDatasource.bind(this),
      10000
    );
  }

  /**
  * Function for editing a datasource, for updating.
  */
  async putDatasource() {
    try {
      if (this.isUpdateFor == false || (this.isUpdateFor == true && this.dataset.datasource.revisions.find((r) => r.number == this.dataset.datasource.currentRevision).write_type == 'DELTA')) {
        const formData = new FormData();
        this.data.forEach((d) => {
          formData.append(d.name, d.data);
        })
        this.plugin.forEach((p) => {
          formData.append(p.name, p.data);
        })
        formData.append("datasource_definition", JSON.stringify(JSON.parse(this.datasourceDefinition.toString())));
        const response = await fetch(
          `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/update-datasource`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
            },
            body: formData,
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        this.datasourceDefinition = '';
      } else {
        const formData = new FormData();
        formData.append("title", "update_for: " + this.dataset.id);
        this.data.forEach((d) => {
          formData.append(d.name, d.data);
        })
        this.plugin.forEach((p) => {
          formData.append(p.name, p.data);
        })
        formData.append("datasource_definition", JSON.stringify(JSON.parse(this.datasourceDefinition.toString())));
        const response = await fetch(
          `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/create`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
            },
            body: formData,
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        this.datasourceDefinition = '';
        routingStore.history.push('/ingestion')
      }
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for checking if the profiling was done.
  */
  getColumnsProfiling(attributes: IAttribute[]): boolean {
    var result = false;
    attributes.forEach(element => {
      if (element.isObject) {
        this.getColumnsProfiling(element.attributes);
      }
      else if (element.isArrayOfObjects) {
        this.getColumnsProfiling(element.attributes);
      }
      else {
        if (element.stats != undefined) {
          result = true;
        }
      }
    });
    return result;
  }

  /**
  * Function getting the schema after update and after profiling.
  */
  async getSchemaAndProfiling() {
    if (this.profilingIsRunning == true) {
      try {
        const response = await fetch(
          `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = (await response.json())
        let d = json as IDataset;
        if (this.getColumnsProfiling(d.schema.entities[0].attributes) == true && this.profilingIsRunning == true) {
          this.dataset.schema = d.schema;
          this.profilingIsRunning = false;
          this.canNotRunProfiling = true;
          alert(t('dataset.profileTabProfilingFinished'));
        }
      } catch (ex) {
        console.log(ex);
        this.setStatus(StoreStatus.failed);
      }
    }
  }

  /**
  * Function for unsetting the stats from the schema.
  */
  unsetStats(attributes: IAttribute[]) {
    attributes.forEach(element => {
      if (element.isObject) {
        this.unsetStats(element.attributes);
      }
      else if (element.isArrayOfObjects) {
        this.unsetStats(element.attributes);
      }
      else {
        element.stats = undefined;
      }
    });
  }

  /**
  * Function for getting the datasource.
  */
  async getDatasource() {
    this.getLogs();
    this.getSchemaAndProfiling();
    if ((this.dataset.datasource.ingestions.find((item) => item.revision == this.dataset.datasource.currentRevision)?.state != "FINISHED" && this.isRunningUpdate == true) || (this.dataset.datasource.ingestions.find((item) => item.revision == this.dataset.datasource.currentRevision)?.state == "FINISHED" && this.isRunningUpdate == true)) {
      try {
        const response = await fetch(
          `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = (await response.json())
        let d = json as IDataset;
        this.dataset.schema = d.schema;
        this.dataset.datasource = d.datasource;
        if (this.dataset.datasource.ingestions.find((item) => item.revision == this.dataset.datasource.currentRevision)?.state == "FINISHED" && this.isRunningUpdate == true && this.dataset.schema != undefined) {
          if (this.dataset.schema.type == 'SEMISTRUCTURED') {
            this.unsetStats(this.dataset.schema.entities[0].attributes);
          }
          this.isRunningUpdate = false;
          this.canNotRunProfiling = false;
          if (this.dataset.schema.type == 'UNSTRUCTURED') {
            this.sizeOfFiles = 0;
            this.dataset.schema.files.forEach(file => {
              this.sizeOfFiles = this.sizeOfFiles + file.sizeInBytes;
            })
          }
        }
      } catch (ex) {
        console.log(ex);
        this.setStatus(StoreStatus.failed);
      }
    }
  }

  /*
  ------------------------------------------------------------------
  Query Tab
  ------------------------------------------------------------------
  */

  /**
  * Function for fill the list of the schema with correct 
  * column namens and for usage in the query. 
  * @param {IAttribute} attributes list of attributes.
  * @param {string} prefix correct prefix if nested.
  */
  getColumns(attributes: IAttribute[], prefix: string) {
    attributes.forEach(element => {
      if (element.isObject) {
        this.getColumns(element.attributes, prefix + element.name + '.');
      }
      else if (element.isArrayOfObjects) {
        this.getColumns(element.attributes, prefix + element.name + (element.attributes.length > 0 ? '[0].' : '[0]'));
      }
      else {
        this.columns.push(prefix + element.name);
      }
    });
  }

  /**
  * Function for saving the query result and start the ingestion.  
  * @param {string} datasetname name of the dataset.
  * @param {boolean} isPolymorph defines whether the new dataset is polymorph or not.
  * @param {string} writeType the write type for the ingestin. Allowed are DELTA and DEFAULT.
  */
  async startIngestion(datasetname: string, isPolymorph: boolean, writeType: string) {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/query`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.sessionId,
            query: this.craftedQuery,
            is_save: true,
            datasetname: datasetname,
            is_polymorph: isPolymorph,
            write_type: writeType,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function running a query.  
  */
  async postQuery() {
    try {
      this.queryPreview = undefined;
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/query`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.sessionId,
            query: this.craftedQuery,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        alert(await response.text());
        throw new Error(response.statusText)
      };
      const json = (await response.json());
      this.queryPreview = json as IPreview;
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function that crafts the needed query for the user.  
  */
  @action craftQuery() {
    let query = "SELECT ";
    this.columnsToSelect?.map((item, index) => {
      if (index == 0) {
        query = query + item;
      } else {
        query = query + ', ' + item;
      }
    })
    query = query + ' FROM ' + this.dataset.id + ' '

    if (this.columnsToFilter.length != 0) {
      query = query + ' WHERE '
      this.columnsToFilter?.map((item, index) => {
        if (index == 0) {
          query = query + item;
        } else {
          query = query + ' AND ' + item;
        }
      })
    }

    if (this.columnsToGroupBy.length != 0) {
      query = query + ' GROUP BY '
      this.columnsToGroupBy?.map((item, index) => {
        if (index == 0) {
          query = query + item;
        } else {
          query = query + ', ' + item;
        }
      })
    }
    if (this.columnsToOrderBy.length != 0) {
      query = query + ' ORDER BY '
      this.columnsToOrderBy?.map((item, index) => {
        if (index == 0) {
          query = query + item;
        } else {
          query = query + ', ' + item;
        }
      })
    }
    query = query + " LIMIT " + this.limit;
    query = query + ';';
    this.craftedQuery = query;
  }

  /**
  * Function for setting select.  
  */
  @action appendSelect() {
    if (this.columnsToSelect.find(element => element == (this.selectAggregation == '' ? this.selectColumn : this.selectAggregation + '(' + this.selectColumn + ')')) == undefined) {
      this.columnsToSelect.push(this.selectAggregation == '' ? this.selectColumn : this.selectAggregation + '(' + this.selectColumn + ')');
      this.craftQuery();
      this.disabled = false;
      this.selectColumn = '*';
    }
  }

  /**
  * Function for removing select.  
  * @param {string} value new value for select.
  */
  @action removeSelect(value: string) {
    this.columnsToSelect.remove(value);
    this.craftQuery();
  }

  /**
  * Function for setting filter by.  
  */
  @action appendFilter() {
    if (this.columnsToFilter.find(element => element == (this.filterColumn + ' ' + this.filterOperator + ' ' + this.filterValueOne + (this.filterValueTwo == undefined ? '' : ' AND ' + this.filterValueTwo))) == undefined) {
      this.columnsToFilter.push(this.filterColumn + ' ' + this.filterOperator + ' ' + this.filterValueOne + (this.filterValueTwo == undefined ? '' : ' AND ' + this.filterValueTwo));
      this.craftQuery();
      this.filterColumn = '';
      this.filterOperator = '';
      this.filterValueOne = '';
      this.filterValueTwo = undefined;
    }
  }

  /**
  * Function for removing filter by.
  * @param {string} value new value for filter by.  
  */
  @action removeFilter(value: string) {
    this.columnsToFilter.remove(value);
    this.craftQuery();
  }

  /**
  * Function for setting group by.  
  */
  @action appendGroup() {
    if (this.columnsToGroupBy.find(element => element == this.groupByColumn) == undefined) {
      this.columnsToGroupBy.push(this.groupByColumn);
      this.craftQuery();
      this.groupByColumn = '';
    }
  }

  /**
  * Function for removing group by.  
  * @param {string} value new value for group by.
  */
  @action removeGroup(value: string) {
    this.columnsToGroupBy.remove(value);
    this.craftQuery();
  }

  /**
  * Function for setting order by.  
  */
  @action appendOrder() {
    if (this.columnsToOrderBy.find(element => element == (this.orderByColumn + ' ' + this.sortDirection.toUpperCase())) == undefined) {
      this.columnsToOrderBy.push(this.orderByColumn + ' ' + this.sortDirection.toUpperCase());
      this.craftQuery();
      this.orderByColumn = ''
      this.sortDirection = ''
    }
  }

  /**
  * Function for removing order by.  
  * @param {string} value new value for order by.
  */
  @action removeOrder(value: string) {
    this.columnsToOrderBy.remove(value);
    this.craftQuery();
  }

  /**
  * Function for setting limit.  
  * @param {string} value new value for limit.
  */
  @action changeLimit(value: string) {
    this.limit = value;
    this.craftQuery();
  }

  /*
  ------------------------------------------------------------------
  Option Tab
  ------------------------------------------------------------------
  */

  /**
  * Function for getting all user of the workspace.
  */
  public async getAllUsersOfWorkspace() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/users`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const users = (await response.json())
      this.users.replace(users as IUser[]);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function to set the status of the dataset. 
  * This can be public or private. If the dataset is
  * private, users in the workspace can be added.
  */
  public async setDatasetStatus() {
    try {
      const response = await fetch(`${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/status`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      this.dataset.isPublic = !this.dataset.isPublic
      if (this.dataset.isPublic != true) {
        const users = await response.json()
        this.dataset.users = observable.array(users as IUser[]);
        this.dataset.permission = { canRead: true, canWrite: true, canDelete: true };
        this.dataset.isIndexed = false;
      }
      else {
        let u = this.dataset.users as IObservableArray;
        u.replace([] as IUser[]);
        this.dataset.permission = undefined;
      }
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function to unindex or index the dataset. 
  * Note this will only work for public datasets.
  */
  public async setDatasetIndex() {
    try {
      if (this.dataset.isIndexed == true) {
        const response = await fetch(`${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/index`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error(response.statusText);
        this.dataset.isIndexed = false;
      }
      else {
        const response = await fetch(`${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/index`, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error(response.statusText);
        this.dataset.isIndexed = true;
      }
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function to set the status of the dataset. 
  * @param {string} selectedUser email of the user that should be added.
  * @param {boolean} canRead defines whether the user can read or not.
  * @param {boolean} canWrite defines whether the user can write or not.
  * @param {boolean} canDelete defines whether the user can delete or not.
  */
  public async addUserToDataset(selectedUser: string, canRead: boolean, canWrite: boolean, canDelete: boolean) {
    try {
      const response = await fetch(`${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/users`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "email": selectedUser,
          "add": true,
          "can_read": canRead,
          "can_write": canWrite,
          "can_delete": canDelete,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      const user = (await response.json())
      this.dataset.users.push(user as IUser);
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function to remove the access of a given user from the dataset. 
  * @param {string} userToDelete email of the user that should be removed.
  */
  async removeUserFromDataset(userToDelete: string) {
    try {
      const response = await fetch(`${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/users`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "email": userToDelete,
          "add": false,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      let u = this.dataset.users as IObservableArray;
      u.remove(this.dataset.users.find((u) => u.email == userToDelete));
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function to edit the permission of a user in the dataset. 
  * @param {string} selectedUser email of the user that should be edited.
  * @param {boolean} canRead defines whether the user can read or not.
  * @param {boolean} canWrite defines whether the user can write or not.
  * @param {boolean} canDelete defines whether the user can delete or not.
  */
  public async updatePermissionForUser(selectedUser: string, canRead: boolean, canWrite: boolean, canDelete: boolean) {
    try {
      const response = await fetch(`${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/users`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "email": selectedUser,
          "can_read": canRead,
          "can_write": canWrite,
          "can_delete": canDelete,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      const user = (await response.json())
      let u = this.dataset.users as IObservableArray;
      u.remove(this.dataset.users.find((u) => u.email == selectedUser));
      this.dataset.users.push(user as IUser);
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for deleting the dataset. 
  */
  async deleteDataset() {
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}`,
        {
          method: "DELETE",
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      var d = workspacesStore.favorites.find((d) => d.id == this.dataset.id);
      if (d != undefined) {
        workspacesStore.favorites.remove(d);
      }
      searchStore.datasets.clear();
      routingStore.history.push('/');
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  async openDeequ(item: IDataset, version: string) {
    this.setStatus(StoreStatus.working);
    const uri = `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${item.id}/cleaning/verify?session_id=-&version=${version}`;
    try {
      if (!workspacesStore.currentWorkspace)
        throw new Error("Current workspace must be set.");
      const response = await fetch(uri,
        {
          method: "GET",
          credentials: 'include',
        }
      )

      if (!response.ok) throw new Error(response.statusText);
      const result = (await response.json());
      const object = toJS(result);
      if (object == null || object == 'undefined' ) {
        this.validation_results = null;
      }
      else {
        this.validation_results = object.response;
        
      }

      this.setStatus(StoreStatus.ready);
    } catch (ex) {
      console.error(ex.message);
      this.setStatus(StoreStatus.failed);
    }
  }

  getView = () => <View viewModel={this} />
}


export default ViewModel