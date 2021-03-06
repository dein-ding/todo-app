import { Directive, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';

@Directive({
    selector: '[domChanges], [textChanges]',
})
export class DomChangesListenerDirective implements OnDestroy, OnChanges {
    constructor(private elementRef: ElementRef<HTMLElement>) {
        const element = this.elementRef.nativeElement;

        this.changes = new MutationObserver((mutations: MutationRecord[]) => {
            mutations.forEach((mutation: MutationRecord) => {
                if (this.domChangesOptions.plainOnly && element.childNodes.length > 1) {
                    element.innerHTML = element.innerText.trim();
                    return;
                }

                this.domChanges.emit(mutation);
                if (this.domChangesOptions.plainOnly) this.textChanges.emit(element.innerText.trim());
                else this.textChanges.emit(element.innerText.trim() ? element.innerHTML.trim() : '');
            });
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ('domChangesOptions' in changes)
            if (this.domChangesOptions.observe) {
                this.changes.observe(this.elementRef.nativeElement, {
                    attributes: false,
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
            } else this.changes.disconnect();
    }
    ngOnDestroy(): void {
        this.changes.disconnect();
    }

    private changes: MutationObserver;

    @Output()
    public domChanges = new EventEmitter<MutationRecord>();
    @Output()
    public textChanges = new EventEmitter<string>();

    @Input()
    domChangesOptions: {
        plainOnly?: boolean;
        observe?: boolean;
    } = {
        plainOnly: false,
        observe: true,
    };
}
