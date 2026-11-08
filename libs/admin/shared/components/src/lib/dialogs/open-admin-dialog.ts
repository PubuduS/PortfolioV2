import { type ComponentType } from '@angular/cdk/overlay';
import { type ViewContainerRef } from '@angular/core';
import {
  type MatDialog,
  type MatDialogRef,
} from '@angular/material/dialog';

/**
 * Open a dialog in the page's injector so it can see the route writer.
 * @param dialog dialog service
 * @param viewContainerRef page view container
 * @param component dialog type
 * @param data record or editor target
 * @param width optional width. Document delete leaves this unset.
 * @returns the open dialog
 */
export function openAdminDialog<T, D, R>(
  dialog: MatDialog,
  viewContainerRef: ViewContainerRef,
  component: ComponentType<T>,
  data: D,
  width?: string,
): MatDialogRef<T, R> {
  return dialog.open(component, {
    autoFocus: 'first-tabbable',
    restoreFocus: true,
    ...(width === undefined ? {} : { width }),
    viewContainerRef,
    data,
  });
}
