import { Injectable } from '@angular/core';
import { DataEdit_, EditMenuComponent } from './edit-menu.component';
import { editmenuProps, editmenuPropsTask, editmenuPropsTasklist } from './edit-menu.model';

export interface returnInterface {
    updatedProps: DataEdit_;
    responseStatus: 'OK' | 'Cancelled' | 'Deleted';
}

@Injectable({
    providedIn: 'root',
})
export class EditMenuService {
    editMenu: EditMenuComponent;
    return: ({}: returnInterface) => void;

    editTask(props: editmenuPropsTask) {
        this.editMenu.open({ data: props, type: 'Task' });

        return new Promise((resolve, reject) => {
            this.return = ({ updatedProps, responseStatus }: returnInterface) => {
                switch (responseStatus) {
                    case 'OK': resolve(updatedProps); break; 
                    case 'Cancelled': reject('Cancelled'); break; 
                    case 'Deleted': reject('Deleted'); break; 
                } //prettier-ignore
            };
        });
    }
    editTaskList(props: editmenuPropsTasklist) {
        this.editMenu.open({ data: props, type: 'TaskList' });

        return new Promise((resolve, reject) => {
            this.return = ({ updatedProps, responseStatus }: returnInterface) => {
                switch (responseStatus) {
                    case 'OK': resolve(updatedProps); break;
                    case 'Cancelled': reject('Cancelled'); break; 
                    case 'Deleted': reject('Deleted'); break; 
                } //prettier-ignore
            };
        });
    }
}