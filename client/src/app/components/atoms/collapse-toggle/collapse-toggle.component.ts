import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { colorClasses } from 'src/app/shared/css-classes.model';
import { isTouchDevice } from 'src/app/shared/utils';

@Component({
    selector: 'collapse-toggle',
    templateUrl: './collapse-toggle.component.html',
    styleUrls: ['./collapse-toggle.component.scss'],
})
export class CollapseToggleComponent implements OnInit {
    constructor() {}
    @Input() @Output() isOpen = false;
    @Input('hideToggleText') toggleText: true | 'dimm' | '' = true;
    @Input() dimm: 'none' | 'dimm-1' | 'dimm-2' = 'dimm-1';
    @Input() colorClass: colorClasses = 'clr-tinted-neutral';
    @Input('noSpacing') spacing: true | '' = true;

    @Output() onToggle = new EventEmitter<boolean>();

    isTouchDevice = isTouchDevice();

    ngOnInit(): void {}
}
