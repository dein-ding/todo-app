import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Utility } from '../shared/utility.model';
import { Task } from './task.model';

@Component({
    selector: 'task',
    templateUrl: './task.component.html',
    styleUrls: ['./task.component.css'],
})
export class TaskComponent implements OnInit {
    util = new Utility();

    @Output() onDataSensitiveAction = new EventEmitter();
    dataSensitiveAction = () => this.onDataSensitiveAction.emit();

    @Input() @Output() data!: Task;

    setCompleted = (status: boolean) => {
        this.data.isCompleted = status;
        this.data.timeCompleted = new Date();

        this.dataSensitiveAction();
    };

    toggleCompleted = () => this.setCompleted(!this.data.isCompleted);

    addSubTask = () => {
        const newTaskName = prompt('new task name') || '';
        if (!newTaskName) return;
        this.data.subTasks.push(new Task(newTaskName));

        this.dataSensitiveAction();
    };

    toggleSubtaskList = () => {
        this.data.collapseSubtaskList = !this.data.collapseSubtaskList;

        this.dataSensitiveAction();
    };

    editTask = () => {
        const newTaskName = prompt('new task name', this.data.name); // TODO: make edit menu work
        if (!newTaskName) return;
        this.data.name = newTaskName;

        this.dataSensitiveAction();
    };

    @Output() onDeleteTask = new EventEmitter<string>();
    deleteTask = (id: string) => this.onDeleteTask.emit(id);

    ngOnInit(): void {}
}
