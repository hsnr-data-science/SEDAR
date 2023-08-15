import { action, computed, makeObservable, observable } from 'mobx'
import { IWorkspace, IWorkspaceExchange } from '../../../../models/workspace'
import workspacesStore from '../../../../stores/workspaces.store'

/**
* ViewModel for workspace changer.
*/
class ViewModel {
    @observable isDialogOpen: boolean = false;
    @observable workspaceTitle: string = '';
    @observable workspaceDescription: string = '';
    @observable anchorEl: null | HTMLElement = null;

    @computed get isMenuOpen() {
        return Boolean(this.anchorEl)
    }

    constructor() {
        makeObservable(this)
    }

    @action openDialog() {
        this.closeMenu()
        this.workspaceTitle = ''
        this.workspaceDescription = ''
        this.isDialogOpen = true
    }

    @action closeDialog() {
        this.isDialogOpen = false
    }

    @action setWorkspaceTitle(newValue: string) {
        this.workspaceTitle = newValue
    }

    @action setWorkspaceDescription(newValue: string) {
        this.workspaceDescription = newValue
    }
    
    @action setAnchorEl(newValue: HTMLElement) {
        this.anchorEl = newValue
    }

    @action closeMenu() {
        this.anchorEl = null
    }

    changeWorkspace(item: IWorkspace) {
        workspacesStore.setCurrentWorkspace(item)
        this.closeMenu()
    }

    addNewWorkspace() {
        workspacesStore.addWorkspace({
            title: this.workspaceTitle,
            description: this.workspaceDescription,
        } as IWorkspaceExchange)
        this.closeDialog()
    }
}

export default ViewModel