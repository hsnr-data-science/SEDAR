import {
    IObservableArray,
    makeObservable,
    observable,
  } from "mobx";
  import React from "react";
  import ContentStore from "../../../models/contentStore";
  import StoreStatus from "../../../models/storeStatus.enum";
  import View from "./main.component";
  import workspacesStore from "../../../stores/workspaces.store";
  import { IWorkspace } from "../../../models/workspace";
  import { IUser } from "../../../models/user";
  import { IOntology } from "../../../models/ontology";
  import searchStore from "../../../stores/search.store";
  import { IComponents } from '../../../models/components'
  
  export interface IElement {
    type: string;
    value: string;
  }
  
  export interface IBindings {
    elements: Array<IElement>;
  }
  
  /**
  * ViewModel for all tabs in the workspace administration view.
  */
  class ViewModel extends ContentStore {
  
    /*
    ------------------------------------------------------------------
    Current Workspace
    ------------------------------------------------------------------
    */
    components: IObservableArray<IComponents>;
    @observable currentWorkspace: IWorkspace = undefined;
    @observable currentWorkspaceForEdit: IWorkspace = undefined;
    @observable selectedUser: string = '';
    @observable ontologyTitle: string = '';
    @observable ontologyDescription: string = '';
    @observable userToDelete: string = '';
    @observable userToChangePermission: string = '';
    @observable ontologyPieValues: number[]=[];
    @observable ontologyPieLabels: string[]=[];
    @observable ontologyPieTwoValues: number[]=[];
    @observable ontologyPieTwoLabels: string[]=[];
    @observable usersPieValues: number[]=[];
    @observable usersPieLabels: string[]=[];
    @observable lastChecked: string = '';
    private refreshIntervalId: number | null = null;
    users: IObservableArray<IUser>;
    file: Blob;
  
    /*
    ------------------------------------------------------------------
    Ontologies
    ------------------------------------------------------------------
    */
  
    @observable ontologyToVisualize: string = '';
    @observable iriOfOntologyToVisualize: string = process.env.WEBVOWL_URL;
    @observable queryConstructToVisualize: string = "";
    @observable ontologyToQuery: string = 'None';
    @observable graphnameOfSelectedOntology: string = 'None';
    @observable queryString: string = '';
    @observable isQuery: boolean = false;
    @observable isConstruct: boolean = false;
    resultHeader: IObservableArray<string>;
    resultValues: IObservableArray<IBindings>;
    
    /*
    ------------------------------------------------------------------
    Init
    ------------------------------------------------------------------
    */
  
    constructor() {
      super();
      this.resultHeader = observable.array([] as string[]);
      this.resultValues = observable.array([] as IBindings[]);
      this.users = observable.array([] as IUser[]);
      makeObservable(this);
      this.initialize();
    }
  
    private async initialize() {
      this.setStatus(StoreStatus.initializing);
      try {
        this.setStatus(StoreStatus.ready);
        this.getCurrentWorkspace();
      } catch (ex) {
        this.setStatus(StoreStatus.failed);
      }
    }
  

  
    /**
    * Function for getting all users of the system.
    */
    public async  getUsers(){
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/users`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const u = await response.json();
      this.users.replace(u as IUser[]);
    }
  
    /**
    * Function for getting all ontologies of the current workspace.
    */
    public async  getOntologies(){
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/ontologies`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const o = await response.json();
      this.currentWorkspace.ontologies = o as IOntology[];
    }
  

      /**
    * Function for getting the complete data for the current workspace.
    */
    public async getCurrentWorkspace(){
      try {
        const response = await fetch(
          process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        const cW = await response.json();
        console.log(cW);
        this.currentWorkspace = cW as IWorkspace;
        this.currentWorkspaceForEdit = cW as IWorkspace;
        await this.getUsers();
      } catch (ex) {
        throw new Error(ex.statusText);
      }
    }
  
    /**
    * Function for adding a new ontology to the current workspace.
    */
    async postOntologyToWorkspace() {
      try {
        const formData = new FormData();
        formData.append("file", this.file);
        formData.append("title", this.ontologyTitle);
        formData.append("description", this.ontologyDescription);
        const response = await fetch(
          process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/ontologies`,
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
        this.currentWorkspace.ontologies.push(await response.json() as IOntology);
        this.ontologyTitle = ''
        this.ontologyDescription = ''
        this.file = null
      } catch (ex) {
        throw new Error(ex.statusText);
      }
    }
  
    /**
    * Function for deleting a ontology from the current workspace.
    */
    async deleteOntology(id:string) {
      try {
        const response = await fetch(
          process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/ontologies/${id}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        this.currentWorkspace.ontologies = this.currentWorkspace.ontologies.filter((o) => o.id != id);
      } catch (ex) {
        throw new Error(ex.statusText);
      }
    }
  
    /**
    * Function for deleting a user to remove his access to the current workspace.
    */
    async deleteUser() {
      try {
        const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/"+this.currentWorkspace.id+"/users", {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "email":this.userToDelete,
            "add":false,
          }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error(response.statusText);
        this.currentWorkspace.users = this.currentWorkspace.users.filter((u) => u.email != this.userToDelete);
        searchStore.users.remove(searchStore.users.find((u) => u.email == this.userToDelete));
        this.userToDelete = '';
      } catch (ex) {
        throw new Error(ex.statusText);
      }
    }
  
    /**
    * Function for editing a ontology in the current workspace.
    * Note that only title and description can be edited and 
    * not the whole ontology.
    */
    async putOntology(ontologyId:string, title: string, description:string) {
      try {
        const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/"+this.currentWorkspace.id+'/ontologies/'+ontologyId, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "title":title,
            "description":description,
          }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error(response.statusText);
        this.currentWorkspace.ontologies[this.currentWorkspace.ontologies.findIndex((u) => u.id == ontologyId)] = (await response.json()) as IOntology;
      } catch (ex) {
        throw new Error(ex.statusText);
      }
    }
  
    /**
    * Function for editing the current workspace.
    */
    async putCurrentWorkspace() {
      try {
        const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/"+this.currentWorkspace.id, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "title":this.currentWorkspaceForEdit.title,
            "description":this.currentWorkspaceForEdit.description,
          }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error(response.statusText);
        const w =(await response.json()) as IWorkspace;
        this.currentWorkspace.title = w.title;
        this.currentWorkspace.description = w.description;
        if(workspacesStore.currentWorkspace.title != this.currentWorkspace.title){
          workspacesStore.currentWorkspace.title = this.currentWorkspace.title;
        }
      } catch (ex) {
        throw new Error(ex.statusText);
      }
    }
  
    /**
    * Function for adding a user with predefined permissions to the current workspace.
    * @param {boolean} canRead defines whether the user can read or not.
    * @param {boolean} canWrite defines whether the user can write or not.
    * @param {boolean} canDelete defines whether the user can delete or not.
    */
    public async addUserToWorkspace(canRead:boolean, canWrite:boolean, canDelete:boolean) {
      try {
        const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/"+this.currentWorkspace.id+"/users", {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "email":this.selectedUser,
            "add":true,
            "can_read":canRead,
            "can_write":canWrite,
            "can_delete":canDelete,
          }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error(response.statusText);
        this.selectedUser = '';
        const user = (await response.json()) as IUser;
        this.currentWorkspace.users.push(user);
        searchStore.users.push(user);
      } catch (ex) {
        throw new Error(ex.statusText);
      }
    }
  
    /**
    * Function for editing the permissions of a user that has access to the current workspace.
    * @param {boolean} canRead defines whether the user can read or not.
    * @param {boolean} canWrite defines whether the user can write or not.
    * @param {boolean} canDelete defines whether the user can delete or not.
    */
    async updatePermissionForUser(canRead:boolean, canWrite:boolean, canDelete:boolean) {
      try {
        const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/"+this.currentWorkspace.id+"/users", {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "email":this.userToChangePermission,
            "can_read": canRead,
            "can_write": canWrite,
            "can_delete": canDelete,
          }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error(response.statusText);
        this.currentWorkspace.users[this.currentWorkspace.users.findIndex((u) => u.email == this.userToChangePermission)] = (await response.json()) as IUser;
      } catch (ex) {
        throw new Error(ex.statusText);
      }
    }
  
    /**
    * Function for downloading a ontology that is in the current workspace.
    * @param {string} ontologyId id of the ontology.
    * @param {string} filename name of the file that the downloaded ontology should have.
    */
    public async downloadOntology(ontologyId:string, filename:string){
      //https://pretagteam.com/question/materialui-how-to-download-a-file-when-clicking-a-button
      try {
        const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/"+this.currentWorkspace.id+'/ontologies/'+ontologyId+'/download', {
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
  
    /*
    ------------------------------------------------------------------
    Ontologies
    ------------------------------------------------------------------
    */
  
    /**
    * Function for setting the current ontology.
    * @param {string} newValue name of the ontology.
    */
    setOntologyToVisualize(newValue: string){
      this.ontologyToVisualize = newValue;
      this.iriOfOntologyToVisualize=process.env.WEBVOWL_URL+"/#iri="+process.env.IRI_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/workspaces/'+workspacesStore.currentWorkspace.id+"/ontologies/iri/"+newValue;
    }
  
    /**
    * Function to query the given ontology.
    */
    public async query() {
      try {
        if (!workspacesStore.currentWorkspace)
          throw new Error("Current workspace must be set.");
        const queryformData = new FormData();
        queryformData.append("querystring", this.queryString);
        queryformData.append("is_query", this.isQuery.toString());
        queryformData.append("graph_name", this.ontologyToQuery);
  
        if (this.isQuery == true) {
          var URI = process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/ontologies/search?`
            + new URLSearchParams({
              querystring: this.queryString.toString(),
              is_query: "True",
            })
        } 
        else if (this.isConstruct == true){
          this.resultHeader.replace([]);
          this.queryConstructToVisualize = process.env.WEBVOWL_URL+"/#iri="+process.env.IRI_URL+"/api/v"+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/"+workspacesStore.currentWorkspace.id+"/ontologies/construct?querystring="+encodeURIComponent(this.queryString.replaceAll("\n", " ").replaceAll("{", "%7B").replaceAll("}", "%7D").replaceAll("/", "%2F").replaceAll("<", "%3C").replaceAll(">", "%3E"))+"&graph_name="+this.ontologyToQuery.toString();
          return;
        }
        else {
          var URI = process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/ontologies/search?`
            + new URLSearchParams({
              querystring: this.queryString.toString().replaceAll(/(\r\n|\n|\r)/gm, ''),
              graph_name: this.ontologyToQuery.toString()=='None'?'?g':this.ontologyToQuery.toString(),
            })
        }
        const response = await fetch(URI, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: 'include',
        })
        if (!response.ok) throw new Error(response.statusText);
        const result = (await response.json());
        this.queryConstructToVisualize="";
        this.resultHeader.replace(result['head']['vars'] as string[]);
        const modal = {} as IBindings;
        this.resultValues.replace([]);
        result['results']['bindings'].forEach((item) => {
          modal.elements = [];
          this.resultHeader.forEach((head) =>{
            const element = {} as IElement;
            element.type = item[head]['type']
            element.value = item[head]['value']
            modal.elements.push(element);
          })
          this.resultValues.push(modal);
          modal.elements = [];
        })
      } catch (ex) {
        throw new Error(ex);
      }
    }
  
    /**
    * Function to get a example sparql query with all required informations.
    */
    getExample(){
      if(this.isConstruct == true){
        //https://www.w3.org/TR/rdf-sparql-query/#accessingRdfGraphs
        this.queryString=`Construct { ?subject ?predicate ?object }
        WHERE {
          GRAPH ${this.ontologyToQuery=="None"?'?g':this.graphnameOfSelectedOntology} {
            ?subject ?predicate ?object
          } .
        }
        LIMIT 25
        `;
      }
      else if(this.isQuery==true){
        this.queryString=`SELECT ?subject ?predicate ?object
        WHERE {
          GRAPH ${this.ontologyToQuery=='None'?'?g':this.graphnameOfSelectedOntology} {
            ?subject ?predicate ?object
          }
        }
        LIMIT 25
        `;
      }
    }
  
    getView = () => <View viewModel={this} />;
  }
  
  export default ViewModel;
  