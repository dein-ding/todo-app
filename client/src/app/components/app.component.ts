import { AfterViewInit, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppData, AppState } from '../reducers';
import { AppDataService } from '../services/app-data.service';
import { ListsService } from '../services/lists.service';
import { TasksService } from '../services/tasks.service';
import { WINDOW_TITLE_SUFFIX } from '../shared/constants';
import { getProgressFromCompletedCount, getProgressRecursive, ProgressChangeEvent } from '../shared/task.model';
import { TaskList } from '../shared/taskList.model';
import { isTouchDevice, moveToMacroQueue, shortenText } from '../shared/utils';
import { DialogService } from './organisms/dialog';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
    constructor(
        private store: Store<AppState>,
        private appDataService: AppDataService,
        private listsService: ListsService,
        private tasksService: TasksService,
        private dialogService: DialogService
    ) {
        this.store.subscribe(data => {
            this.data = data.appData;
            this.activeTaskList = this.getListById(this.data.activeListId);
            this.boundListName = this.activeTaskList?.name;
            this.getProgressFirstTime();

            console.log('%cupdated state:', 'color: gray', this.data);

            document.title = this.activeTaskList
                ? `${shortenText(this.activeTaskList.name, 20)} - ${WINDOW_TITLE_SUFFIX}`
                : WINDOW_TITLE_SUFFIX;
        });
    }

    ngAfterViewInit() {
        if (this.isTouchDevice) document.body.classList.add('touchDevice');
        this.quickAddInputField.focus(0);
    }

    data: AppData;
    completedTasksCount: number;
    activeTaskList: TaskList | undefined;
    taskNameInput: string;

    listProgress: number;
    private async getProgressFirstTime() {
        if (!this.activeTaskList) {
            this.listProgress = 0;
            this.completedTasksCount = 0;
            return;
        }

        const progressDecimal = await getProgressRecursive(this.activeTaskList.list);
        this.listProgress = progressDecimal;

        // @FIXME: this made the e2e test fail at some point (activeTaskList = undefined), which is werid because it shouldn't
        const completedCount = progressDecimal * this.activeTaskList.list.length;
        this.completedTasksCount = completedCount;
    }
    onProgressChanged({ prevProgress, currProgress }: ProgressChangeEvent) {
        const completedCount = this.completedTasksCount - prevProgress + currProgress;
        this.completedTasksCount = completedCount;

        this.listProgress = getProgressFromCompletedCount(completedCount, this.activeTaskList.list.length);
    }

    showCompleted = false;

    isTouchDevice = isTouchDevice();
    isMobileMenuOpen: boolean;
    setMobileMenuOpen(open: boolean) {
        if (!open) this.selectModeEvents.next(false);
        this.isMobileMenuOpen = open;
    }
    selectModeEvents = new Subject<boolean>();

    updatedListName: string;
    boundListName: string;
    updateListName() {
        this.listsService.updateList({ ...this.activeTaskList, name: this.updatedListName });
    }
    isListNameFocused = false;
    listNameFocusHandler(nowFocused: boolean) {
        this.isListNameFocused = nowFocused;

        if (nowFocused) this.resetListName();
        else if (this.updatedListName != this.activeTaskList.name) this.updateListName();
    }
    listNameKeydownHandler(e: KeyboardEvent, elem: HTMLSpanElement) {
        if (e.key == 'Enter') elem.blur(); // focus handler handles the rest
        if (e.key == 'Escape') {
            this.resetListName();
            elem.blur();
            // change to something slightly different so change detection kicks in
            this.boundListName = this.activeTaskList.name + ' ';
            // and then change it back
            moveToMacroQueue(() => (this.boundListName = this.activeTaskList.name));
        }
    }
    resetListName() {
        this.updatedListName = this.activeTaskList.name;
    }

    quickAddInputField = {
        focusEventsSubject: [new Subject<boolean>(), new Subject<boolean>()],
        focus: (inputField: number) => this.quickAddInputField.focusEventsSubject[inputField].next(true),
    };

    //////////////////// Tasks ////////////////////
    createTask(newTaskName: string) {
        this.tasksService.createTask(this.activeTaskList.id, newTaskName);
    }
    addTask = [
        (newTaskName: string) => {
            if (!newTaskName) return;
            if (this.data.lists.length == 0) {
                this.dialogService.confirm({ title: "You don't have any lists." });
                return;
            }
            this.createTask(newTaskName);
            this.quickAddInputField.focus(0);
        },
        (newTaskName: string) => {
            this.createTask(newTaskName);
            this.quickAddInputField.focus(1);
        },
    ];

    //////////////////// Lists ////////////////////
    getListById = (id: string): TaskList | undefined => this.data.lists.find(list => list.id == id);
    getListIndexById = (id: string): number => this.data.lists.findIndex(list => list.id == id);

    setActiveList(listId: string) {
        this.listsService.setActiveList(listId);
        this.isMobileMenuOpen = false;
    }

    async createList() {
        const { created } = await this.listsService.createList();
        if (created) this.setMobileMenuOpen(false);
    }

    editList() {
        this.listsService.openListDetails(this.activeTaskList);
    }

    deleteList(listId: string) {
        this.listsService.deleteList(listId);
    }

    sortLists(sortedLists: TaskList[]) {
        this.listsService.sortLists(sortedLists);
    }

    exportLists(listIds: string[]) {
        return this.appDataService.exportAsJSON(...listIds);
    }
    exportActiveList() {
        return this.appDataService.exportAsJSON(this.activeTaskList.id);
    }
    async importJson(inputRef: HTMLInputElement) {
        const unparsed = await inputRef.files[0].text();
        this.appDataService.importFromJSON(unparsed);
    }

    /////////////////// misc ////////////////////
    showDevIndicator = !environment.production && sessionStorage.showDevIndicator != 'false';
    hideDevIndicator() {
        sessionStorage.showDevIndicator = false;
        this.showDevIndicator = false;
    }
}
