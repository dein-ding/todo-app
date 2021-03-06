import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { TasksService } from 'src/app/services/tasks.service';
import { TaskUiState, UiStateService } from 'src/app/services/ui-state.service';
import {
    getProgressRecursive,
    ProgressChangeEvent,
    Task,
    getProgressFromCompletedCount,
} from '../../../shared/task.model';
import { countTasksRecursive } from '../../../shared/taskList.model';
import { formatDateRelative, isTouchDevice, moveToMacroQueue } from '../../../shared/utils';
import { editmenuOptions } from '../../organisms/edit-menu/edit-menu.model';

@Component({
    selector: 'task',
    templateUrl: './task.component.html',
    styleUrls: [
        './scss/task.component.scss',
        './scss/priority-icon.task.component.scss',
        './scss/details-pop-out.task.component.scss',
        './scss/detail-icons.task.component.scss',
        './scss/completed-at.task.component.scss',
        './scss/snackbar.task.component.scss',
        './scss/task-actions.task.component.scss',
    ],
})
export class TaskComponent implements OnInit {
    constructor(private tasksService: TasksService, private uiStateService: UiStateService) {}
    async ngOnInit() {
        this.isCompleted = this.data.isCompleted;

        this.formattedCompletionDate = this.isCompleted ? formatDateRelative(this.data.completedAt) || 'invalid' : null;

        this.uiState = this.uiStateService.getTaskState(this.data.id);
        this.isDetailsPopOutOpen = this.uiState.detailsPopOut.keepOpen;
        this.updatedNotes = this.data.meta.notes;

        if (this.data.subTasks.length == 0) this.updateProgress(this.isCompleted ? 1 : 0);
        else this.updateProgress(await getProgressRecursive(this.data.subTasks));
    }

    @Input() taskPosition: number;
    @Input() data: Task;
    completedTasksCount = 0;
    openTasksCount = 0;

    progressDecimal = 0;
    private updateProgress(progressDecimal: number) {
        this.progressDecimal = progressDecimal;

        const completedCount = progressDecimal * this.data.subTasks.length;
        this.completedTasksCount = completedCount;
        this.openTasksCount = this.data.subTasks.length - Math.floor(completedCount);
    }
    private updateProgressFromCompletedCount(completedCount: number) {
        const progressDecimal = getProgressFromCompletedCount(completedCount, this.data.subTasks.length);
        this.emitNewProgress(progressDecimal);
        this.progressDecimal = progressDecimal;

        this.completedTasksCount = completedCount;
        this.openTasksCount = this.data.subTasks.length - Math.floor(completedCount);
    }
    @Output() progressChange = new EventEmitter<ProgressChangeEvent>();
    emitNewProgress(newProgress: number) {
        this.progressChange.emit({ prevProgress: this.progressDecimal, currProgress: newProgress });
    }
    onSubtaskProgressChanged({
        prevProgress: prevSubtaskProgress,
        currProgress: currSubtaskProgress,
    }: ProgressChangeEvent) {
        this.updateProgressFromCompletedCount(this.completedTasksCount - prevSubtaskProgress + currSubtaskProgress);
    }

    formattedCompletionDate: string | null;

    isCompleteBtnHovered = false; //TODO: outsource this into CSS

    isTouchDevice = isTouchDevice();
    optButtonSize: 'm' | 's' = this.isTouchDevice ? 'm' : 's';
    isTaskActionBtnsMenuOpenOnTouchDevice = false;
    setIsTaskActionBtnsMenuOpenOnTouchDevice = (nowOpen: boolean) =>
        (this.isTaskActionBtnsMenuOpenOnTouchDevice = nowOpen);

    quickAddInputFocusEventSubject = new Subject<boolean>();
    focusQuickAddInputField = () => this.quickAddInputFocusEventSubject.next(true);

    isViewingDetails = false;
    setIsViewingDetails(isViewing: boolean) {
        if (isViewing) this.isViewingDetails = true;
        else setTimeout(() => (this.isViewingDetails = false), 500);
    }

    isDeleting = false;
    setIsDeleting(isDeleting: boolean) {
        if (isDeleting) this.isDeleting = true;
        else setTimeout(() => (this.isDeleting = false), 500);
    }

    isFocused = false;
    updatedTaskName: string;
    updateTaskName() {
        if (this.updatedTaskName != this.data.name)
            this.tasksService.updateTaskDetails({ ...this.data, name: this.updatedTaskName });
    }

    isNotesBlockFocused = false;
    updatedNotes: string;
    updateNotes() {
        if (this.updatedNotes == this.data.meta.notes) return;

        this.tasksService.updateTaskDetails({
            ...this.data,
            meta: { ...this.data.meta, notes: this.updatedNotes },
        });
    }
    notesBlockKeydownHandler(e: KeyboardEvent) {
        if (e.key == 'Enter' && (e.ctrlKey || e.metaKey)) this.onLeaveNotesBlock();
        if (e.key == 'Escape') {
            // this.resetNotesBlock();
            this.onLeaveNotesBlock(false);
        }
    }

    @ViewChild('taskWrapper') taskWrapper: ElementRef<HTMLDivElement>;
    notesBlockOutsideClickHandler(event: MouseEvent) {
        if (!this.isDetailsPopOutOpen || !this.isNotesBlockFocused) return;

        const clickedOutsideTask = !event.composedPath().some(elem => elem == this.taskWrapper?.nativeElement);
        if (clickedOutsideTask) this.onLeaveNotesBlock();
    }
    onLeaveNotesBlock(saveChanges = true) {
        this.isNotesBlockFocused = false;

        // if (!this.uiState.detailsPopOut.keepOpen) this.toggleDetailsPopOutOpen(saveChanges);
        if (saveChanges) this.updateNotes();

        if (!this.updatedNotes) this.toggleDetailsPopOutOpen(saveChanges);
    }
    notesBlockFocusSubject = new Subject<boolean>();
    focusNotesBlock() {
        this.notesBlockFocusSubject.next(true);
    }
    resetEventsSubject = new Subject();
    resetNotesBlock() {
        this.updatedNotes = this.data.meta.notes;
        this.resetEventsSubject.next(undefined);
    }

    uiState: TaskUiState;
    isDetailsPopOutOpen: boolean;
    setKeepDetailsPopOutOpen(keepOpen: boolean) {
        this.uiState.detailsPopOut.keepOpen = keepOpen;
        this.uiStateService.setTaskState(this.data.id, this.uiState);
    }
    toggleCollapseCompletedSubtasks() {
        this.uiState.collapseCompletedSubtasks = !this.uiState.collapseCompletedSubtasks;
        this.uiStateService.setTaskState(this.data.id, this.uiState);
    }
    toggleCollapseSubtaskList(collapse?: boolean) {
        this.uiState.collapseSubtaskList = collapse !== undefined ? collapse : !this.uiState.collapseSubtaskList;
        this.uiStateService.setTaskState(this.data.id, this.uiState);
    }
    toggleDetailsPopOutOpen(saveChanges = true) {
        this.isDetailsPopOutOpen = !this.isDetailsPopOutOpen;
        this.setKeepDetailsPopOutOpen(this.isDetailsPopOutOpen);

        if (this.isDetailsPopOutOpen) {
            moveToMacroQueue(() => {
                this.resetNotesBlock();
                this.focusNotesBlock();
            });
        } else if (saveChanges) this.updateNotes();
    }

    isCompleted: boolean;
    toggleCompleted = () => this.setCompleted(!this.data.isCompleted);
    private setCompleted = async (nowCompleted: boolean) => {
        const { changedStatus, collapseSubtaskList } = await this.tasksService.updateTaskStatus(this.data.id, {
            nowCompleted,
            wasCompletedBefore: this.data.isCompleted,
            hasOpenSubtasks: countTasksRecursive(this.data.subTasks) > 0,
            delayForAnimation: completeAll =>
                new Promise(resolve => {
                    if (nowCompleted && completeAll) {
                        this.uiState.collapseSubtaskList = false;

                        moveToMacroQueue(() => {
                            const openTasksIds = this.data.subTasks
                                .filter(t => !t.isCompleted)
                                .map(t => '#task-' + t.id);
                            const taskElems = document.querySelectorAll(openTasksIds.join(', '));

                            const delay = 200;
                            taskElems.forEach((taskElem, i) => {
                                setTimeout(() => taskElem.classList.add('completed-transition'), delay * i);
                            });
                            const timeToFinishChildAnimations = delay * openTasksIds.length + 100;

                            setTimeout(() => {
                                this.isCompleted = nowCompleted;
                                this.emitNewProgress(1);

                                setTimeout(() => resolve(), 600);
                            }, timeToFinishChildAnimations + 300);
                        });
                    } else {
                        this.isCompleted = nowCompleted;

                        (async () => {
                            if (nowCompleted) this.emitNewProgress(1);
                            else this.emitNewProgress(await getProgressRecursive(this.data.subTasks));
                        })();

                        setTimeout(() => resolve(), 600);
                    }
                }),
        });

        if (changedStatus && collapseSubtaskList) this.toggleCollapseSubtaskList(true);
    };

    setPriority(priority: number) {
        this.tasksService.updateTaskDetails({ ...this.data, priority });
    }

    async addSubTask(newTaskName?: string) {
        const { created } = await this.tasksService.addSubtask(this.data.id, newTaskName);
        if (created) this.focusQuickAddInputField();
    }

    async openDetails(allowEdit: boolean, highlight?: editmenuOptions['hightlight']) {
        this.setIsViewingDetails(true);
        await this.tasksService.openTaskDetails(
            { ...this.data, meta: { ...this.data.meta, notes: this.updatedNotes } },
            allowEdit,
            highlight
        );
        this.setIsViewingDetails(false);
    }

    async deleteTask() {
        this.setIsDeleting(true);

        // TODO: make this an inline prompt / hold to delete
        await this.tasksService.deleteTask(this.data.id, this.openTasksCount);
        this.setIsDeleting(false);
    }
}
