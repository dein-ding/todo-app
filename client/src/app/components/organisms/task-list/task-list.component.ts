import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ProgressChangeEvent, sortCompletedTasks, Task } from 'src/app/shared/task.model';
import { countTasks } from 'src/app/shared/taskList.model';
import { generateId, getCopyOf } from 'src/app/shared/utils';

@Component({
    selector: 'task-list',
    templateUrl: './task-list.component.html',
    styleUrls: ['./task-list.component.scss'],
})
export class TasklistComponent implements OnInit, OnChanges {
    constructor() {}

    @Input() tasklist: Task[];
    openTasks: Task[];
    completedTasks: Task[];
    sortableTaskData: Task[];

    @Input() variant: 'task' | 'subtask';
    @Input() id: string = generateId();
    @Input() taskPosition?: number = 0;
    @Input() isCompleted?: boolean = false;
    @Input() collapseCompletedTasks: boolean = true;

    @Output() onAddSubtask = new EventEmitter<string>();
    addTask(newTaskName: string) {
        this.onAddSubtask.emit(newTaskName);
    }
    @Output() onToggleCollapseCompleted = new EventEmitter();
    toggleCollapseCompletedSubtasks() {
        this.onToggleCollapseCompleted.emit();
    }

    @Input() focusChangeEvents?: Observable<boolean>;
    private focusChangeEventsSubscription?: Subscription;
    changeQuickAddInputFocus = (focus: boolean) => {
        if (focus)
            setTimeout(() => {
                document.querySelector<HTMLInputElement>('#_' + this.id)?.focus();
            }, 200);
        else document.querySelector<HTMLInputElement>('#_' + this.id)?.blur();
    };

    @Output() progressChange = new EventEmitter<ProgressChangeEvent>();
    onProgressChanged(progress: ProgressChangeEvent) {
        this.progressChange.emit(progress);
    }

    private initData() {
        this.tasklist ||= [];
        this.openTasks = this.tasklist.filter(task => !task.isCompleted);
        this.completedTasks = this.tasklist.filter(task => task.isCompleted).sort(sortCompletedTasks);

        this.sortableTaskData = getCopyOf(this.openTasks);
    }
    ngOnInit(): void {
        this.initData();

        if (this.focusChangeEvents)
            this.focusChangeEventsSubscription = this.focusChangeEvents.subscribe(focus =>
                this.changeQuickAddInputFocus(focus)
            );
    }
    ngOnChanges(changes: SimpleChanges): void {
        if ('tasklist' in changes) this.initData();
    }
    ngOnDestroy() {
        this.focusChangeEventsSubscription?.unsubscribe();
    }

    countOpenTasks = countTasks;
}
