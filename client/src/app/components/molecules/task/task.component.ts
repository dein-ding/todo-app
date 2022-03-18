import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TaskUiState, UiStateService } from 'src/app/services/ui-state.service';
import { AppData, AppDataActions } from '../../../reducers';
import { sortCompletedTasks, Task } from '../../../shared/task.model';
import { countOpenTasks, countOpenTasksRecursive } from '../../../shared/taskList.model';
import { formatDateRelative, isTouchDevice, moveToMacroQueue } from '../../../shared/utility.model';
import { DialogService } from '../../organisms/custom-dialog';
import { editmenuOptions } from '../../organisms/edit-menu/edit-menu.model';
import { EditMenuService } from '../../organisms/edit-menu/edit-menu.service';
import { ModalService } from '../modal/modal.service';

@Component({
    selector: 'task',
    templateUrl: './task.component.html',
    styleUrls: ['./task.component.css'],
})
export class TaskComponent implements OnInit {
    formatDateRelative = formatDateRelative;
    countOpenTasks = countOpenTasks;

    @Input() taskPosition: number;

    log = (...v: any) => console.log(...v);

    completeBtnIsHovered = false;

    isTouchDevice = isTouchDevice();
    touchDevice_showBtns = false;
    /** toggle the task action buttons when on touch a device */
    toggleTaskActionBtns = (v: boolean) => (this.touchDevice_showBtns = v);

    focusQuickAddInputField = () => {
        setTimeout(() => {
            document.querySelector<HTMLInputElement>('#_' + this.data.id)?.focus();
        }, 200);
    };

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

    @ViewChild('notesArea') notesArea: ElementRef<HTMLTextAreaElement>;
    setTextAreaHeight() {
        const area = this.notesArea?.nativeElement;
        if (area) {
            area.style.height = '10px';
            area.style.height = area.scrollHeight + 2 + 'px';

            if (
                this.uiState.detailsPopOut.keepOpen &&
                this.uiState.detailsPopOut.notesAreaHeight != area.style.height
            ) {
                this.uiState.detailsPopOut.notesAreaHeight = area.style.height;
                this.uiStateService.setTaskState(this.data.id, {
                    ...this.uiState,
                    detailsPopOut: {
                        ...this.uiState.detailsPopOut,
                        notesAreaHeight: this.uiState.detailsPopOut.notesAreaHeight,
                    },
                });
            }
        }
    }
    resetNotesArea() {
        this.notesAreaValue = this.data.meta.notes;
        moveToMacroQueue(() => this.setTextAreaHeight());
    }

    @ViewChild('detailIconsWrapper') detailIconsWrapper: ElementRef<HTMLSpanElement>;
    @ViewChild('popOutContainer') popOutContainer: ElementRef<HTMLDivElement>;
    @HostListener('document:click', ['$event'])
    notesAreaBlurHandler(event: MouseEvent) {
        if (!this.isDetailsPopOutOpen || !this.popOutContainer?.nativeElement) return;

        const elemsToCheck: ElementRef<HTMLElement>[] = [this.popOutContainer, this.detailIconsWrapper];
        const clickedOneOfThem = event
            .composedPath()
            .some(elem => elemsToCheck.some(elemToCheck => elem == elemToCheck?.nativeElement));

        // const notesAreaClicked = event.target == this.notesArea.nativeElement;
        // const clickedInsidePopOut = event.composedPath().some(elem => elem == this.popOutContainer.nativeElement);

        if (!clickedOneOfThem)
            if (this.uiState.detailsPopOut.keepOpen) this.updateNotes();
            else this.toggleDetailsPopOutOpen();
    }
    toggleDetailsPopOutOpen(saveChanges = true) {
        this.isDetailsPopOutOpen = !this.isDetailsPopOutOpen;

        if (this.isDetailsPopOutOpen) {
            moveToMacroQueue(() => {
                this.resetNotesArea();
                this.notesArea?.nativeElement?.focus();
            });
        } else {
            this.setKeepDetailsPopOutOpen(false);
            if (saveChanges) this.updateNotes();
        }
    }

    constructor(
        public modalService: ModalService,
        private store: Store<AppData>,
        private dialogService: DialogService,
        private editMenuService: EditMenuService,
        private uiStateService: UiStateService
    ) {}

    @Input() @Output() data: Task;
    isCompleted: boolean;

    uncompletedTasks: Task[];
    completedTasks: Task[];

    setCompleted = (status: boolean) => {
        const openSubtasksLeft = !this.data.isCompleted && countOpenTasksRecursive(this.data.subTasks) > 0;
        const dispatchAction = (completeAllSubtasks = false) => {
            if (status && (!openSubtasksLeft || completeAllSubtasks)) this.toggleCollapseSubtaskList(true);
            this.isCompleted = status;

            setTimeout(() => {
                this.store.dispatch(new AppDataActions.SetCompleted(this.data.id, status, completeAllSubtasks));
            }, 600);
        };

        if (openSubtasksLeft)
            this.dialogService
                .confirm({
                    title: 'Open subtasks left!',
                    text: 'Do you want to mark all subtasks as completed too?',
                    buttons: ['Keep uncompleted', 'Cancel', 'OK'],
                })
                .then(() => dispatchAction(true))
                .catch(clickedButton => clickedButton == 'Keep uncompleted' && dispatchAction());
        else dispatchAction();
    };
    toggleCompleted = () => this.setCompleted(!this.data.isCompleted);

    setPriority(priority: number) {
        this.store.dispatch(new AppDataActions.EditTask(this.data.id, { ...this.data, priority }));
    }

    notesAreaValue: string;
    updateNotes() {
        if (this.notesAreaValue == this.data.meta.notes) return;

        this.store.dispatch(
            new AppDataActions.EditTask(this.data.id, {
                ...this.data,
                meta: { ...this.data.meta, notes: this.notesAreaValue },
            })
        );
    }

    dispatchNewSubtaskAction = (newTaskName: string) =>
        this.store.dispatch(new AppDataActions.AddSubtask(this.data.id, newTaskName));
    addSubTask = (newTaskName?: string) => {
        if (!newTaskName)
            this.dialogService
                .prompt({ title: 'Create new subtask:', buttons: ['Cancel', 'Create'], placeholder: 'subtask name' })
                .then((newTaskName: string) => {
                    this.dispatchNewSubtaskAction(newTaskName);
                    this.focusQuickAddInputField();
                })
                .catch(() => {});
        else {
            this.dispatchNewSubtaskAction(newTaskName);
            this.focusQuickAddInputField();
        }
    };
    editTaskDetails = (hightlight?: editmenuOptions['hightlight']) => {
        this.editMenuService
            .editTaskDetails(
                { ...this.data, meta: { ...this.data.meta, notes: this.notesAreaValue } },
                false,
                hightlight
            )
            .then((updatedTask: Task) => {
                this.store.dispatch(new AppDataActions.EditTask(this.data.id, { ...this.data, ...updatedTask }));
            })
            .catch(err => {
                if (err == 'Deleted') this.deleteTask(this.data.id);
            });
    };
    showDetails = (hightlight?: editmenuOptions['hightlight']) => {
        this.editMenuService
            .editTaskDetails(this.data, true, hightlight)
            .then(() => {})
            .catch(err => {
                if (err == 'Deleted') this.deleteTask(this.data.id);
            });
    };
    deleteTask = (id: string, prompt = true) => {
        const del = () => this.store.dispatch(new AppDataActions.DeleteTask(this.data.id));
        const openSubtasksCount = this.data.subTasks.filter(task => !task.isCompleted).length;
        if (prompt)
            // TODO: make this an inline prompt
            this.dialogService
                .confirm({
                    title: `Delete this task?`,
                    text: openSubtasksCount
                        ? `and ${openSubtasksCount > 1 ? `all ` : ''}it's ${openSubtasksCount} open ${
                              openSubtasksCount > 1 ? `subtasks` : 'subtask'
                          }?`
                        : null,
                    buttons: ['Cancel', '!Delete' + (openSubtasksCount ? ' all' : '')],
                })
                .then(() => del())
                .catch(() => {});
        else del();
    };

    ngOnInit(): void {
        this.isCompleted = this.data.isCompleted;

        this.uncompletedTasks = this.data.subTasks.filter(task => !task.isCompleted);
        this.completedTasks = this.data.subTasks.filter(task => task.isCompleted).sort(sortCompletedTasks);

        this.uiState = this.uiStateService.getTaskState(this.data.id);
        this.isDetailsPopOutOpen = this.uiState.detailsPopOut.keepOpen;
        this.notesAreaValue = this.data.meta.notes;
    }
}
