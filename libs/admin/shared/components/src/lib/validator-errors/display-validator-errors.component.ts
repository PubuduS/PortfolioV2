import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Display validator errors
 */
@Component({
  selector: 'admin-portfolio-display-validator-errors',
  standalone: true,
  templateUrl: './display-validator-errors.component.html',
  styleUrl: './display-validator-errors.component.scss',
  host: {
    class: 'd-block', // Makes the component a block element
  },
})
export class DisplayValidatorErrorsComponent implements OnInit, OnDestroy {
  /** form controller */
  @Input() public control: AbstractControl | null | undefined;
  /** error key */
  @Input() public errorKey!: string;
  /** error message */
  @Input() public message!: string;

  /** subscription */
  private subscription: Subscription | undefined;

  /**
   * constructor
   * @param cdr change detection ref
   */
  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * on initialization
   * Subscribe to value changes to trigger change detection
   */
  public ngOnInit(): void {
    this.subscription = this.control?.statusChanges.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  /**
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Show error
   * @returns true if form is touched dirty or has errors; false otherwise
   */
  public showError(): boolean {
    if (!this.control) return false;
    const hasError = this.control.hasError(this.errorKey);
    const isTouchedOrDirty = this.control.touched || this.control.dirty;
    return !!(hasError && isTouchedOrDirty);
  }
}
