import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { colorClasses } from 'src/app/shared/css-classes.model';

@Component({
    selector: 'single-input-form',
    templateUrl: './single-input-form.component.html',
    styleUrls: ['./single-input-form.component.scss'],
})
export class SingleInputFormComponent implements OnInit, OnDestroy {
    @Input('noTopMargin') topMargin: true | '' = true;

    @ViewChild('inputField') inputFieldRef: ElementRef<HTMLInputElement>;
    @Input() inputFieldId?: string;
    @Input() type: string = 'text';
    @Input() placeholder: string = 'add new task...';
    @Input() value: string = '';
    @Input() noFocusNoBorder: true | '' = true;

    @Input() btnText: string = 'add';
    @Input() btnColorClass: colorClasses = 'clr-secondary';

    @Output() onSubmit = new EventEmitter<string>();
    submit = () => {
        this.onSubmit.emit(this.value);
        this.value = '';
    };

    isFocused = false;
    @Output() focusChange = new EventEmitter<boolean>();
    onFocusChange = (isFocused: boolean) => {
        setTimeout(() => (this.isFocused = isFocused), isFocused ? 0 : 200);
        this.focusChange.emit(isFocused);
    };
    changeFocus(isNowFocused: boolean, delay = 0) {
        if (this.inputFieldRef?.nativeElement)
            setTimeout(() => {
                this.isFocused = isNowFocused;
                if (isNowFocused) this.inputFieldRef.nativeElement.select();
                else this.inputFieldRef.nativeElement.blur();
            }, delay);
    }

    @Input() focusChangeEvents?: Observable<boolean>;
    private focusChangeEventsSubscription?: Subscription;
    ngOnInit() {
        if (this.focusChangeEvents) {
            this.focusChangeEventsSubscription = this.focusChangeEvents.subscribe(focus => this.changeFocus(focus));
        }
    }
    ngOnDestroy() {
        this.focusChangeEventsSubscription?.unsubscribe();
    }
}
