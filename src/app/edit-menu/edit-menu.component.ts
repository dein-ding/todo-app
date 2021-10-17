import { Component, ElementRef, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { TaskList } from '../shared/taskList.model';
import { editmenuProps, editmenuPropsTask, editmenuPropsTasklist } from './edit-menu.model';
import { EditMenuService } from './edit-menu.service';
import { returnInterface } from './edit-menu.service';

interface meta {
    notes: string;
    links?: string[];
}
export class DataEdit_ {
    meta: meta;
    constructor(public name: string, meta: meta, public priority?: number) {
        this.meta = {
            notes: meta.notes,
        };
        if (meta.links) this.meta.links = [...meta.links];
    }
}

@Component({
    selector: 'edit-menu',
    templateUrl: './edit-menu.component.html',
    styleUrls: ['./edit-menu.component.css'],
})
export class EditMenuComponent implements OnInit {
    @Input() @Output() data: any; // Task | TaskList
    dataEdit!: DataEdit_;
    type: editmenuProps['type'];
    readonly defaultData = new DataEdit_('', { notes: '', links: [] }, 0);

    @ViewChild('nameInputRef') nameInputRef: ElementRef;

    constructor(private modalService: ModalService, private editMenuService: EditMenuService) {}

    open(props: editmenuProps) {
        this.type = props.type;

        switch (this.type) {
            case 'Task':
                this.dataEdit = new DataEdit_(
                    props.data.name,
                    props.data.meta,
                    (props.data as editmenuPropsTask).priority
                );
                break;
            case 'TaskList':
                this.dataEdit = new DataEdit_(props.data.name, props.data.meta);
                break;
        }
        this.modalService.open('edit-menu');
        this.nameInputRef.nativeElement.select();
        this.isOpen = true;
    }

    close(btnRes: returnInterface['responseStatus']) {
        this.modalService.close('edit-menu');
        this.isOpen = false;
        this.editMenuService.return({ updatedProps: this.dataEdit, responseStatus: btnRes });
    }

    linkInput: '';
    addLink() {
        if (this.linkInput == '') return;
        this.dataEdit.meta.links.push(this.linkInput);
        this.linkInput = '';
    }
    removeLink(index: number) {
        this.dataEdit.meta.links.splice(index, 1);
    }

    isOpen = false;
    @HostListener('document:keydown', ['$event'])
    keyboardHandler(e: KeyboardEvent) {
        if (!this.isOpen) return;
        if (e.key == 'Enter') this.close('OK');
        if (e.key == 'Escape') this.close('Cancelled');
    }

    ngOnInit(): void {
        this.dataEdit = this.defaultData;
        this.editMenuService.editMenu = this;
    }
}
