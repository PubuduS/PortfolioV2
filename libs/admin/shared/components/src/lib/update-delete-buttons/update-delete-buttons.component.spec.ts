import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { IUpdateDeleteBtnConfigs } from '@portfolio-v2/admin/shared/types';
import { UpdateDeleteButtonsComponent } from './update-delete-buttons.component';

describe('UpdateDeleteButtonsComponent', () => {
  let component: UpdateDeleteButtonsComponent;
  let fixture: ComponentFixture<UpdateDeleteButtonsComponent>;

  // Mock configuration for tests
  const mockConfig: IUpdateDeleteBtnConfigs = {
    isVerticalLayout: true,
    deleteButtonDisabled: false,
    editButtonDisabled: false,
    deleteButtonClick: jest.fn(),
    editButtonClick: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateDeleteButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateDeleteButtonsComponent);
    component = fixture.componentInstance;
  });

  describe('Component Configuration', () => {
    it('should accept required config input', () => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();

      expect(component.config()).toEqual(mockConfig);
    });

    it('should render vertical layout when isVerticalLayout is true', () => {
      fixture.componentRef.setInput('config', { ...mockConfig, isVerticalLayout: true });
      fixture.detectChanges();

      const verticalContainer = fixture.nativeElement.querySelector('.action-buttons:not(.horizontal)');
      expect(verticalContainer).toBeTruthy();
      expect(verticalContainer.classList.contains('row')).toBeFalsy();
    });

    it('should render horizontal layout when isVerticalLayout is false', () => {
      fixture.componentRef.setInput('config', { ...mockConfig, isVerticalLayout: false });
      fixture.detectChanges();

      const horizontalContainer = fixture.nativeElement.querySelector('.action-buttons.horizontal.row');
      expect(horizontalContainer).toBeTruthy();
    });
  });

  describe('Button States', () => {
    it('should enable delete button when deleteButtonDisabled is false', () => {
      fixture.componentRef.setInput('config', { ...mockConfig, deleteButtonDisabled: false });
      fixture.detectChanges();

      const deleteButton = fixture.nativeElement.querySelector('button[color="accent"]');
      expect(deleteButton.disabled).toBeFalsy();
    });

    it('should disable delete button when deleteButtonDisabled is true', () => {
      fixture.componentRef.setInput('config', { ...mockConfig, deleteButtonDisabled: true });
      fixture.detectChanges();

      const deleteButton = fixture.nativeElement.querySelector('button[color="accent"]');
      expect(deleteButton.disabled).toBeTruthy();
    });

    it('should enable edit button when editButtonDisabled is false', () => {
      fixture.componentRef.setInput('config', { ...mockConfig, editButtonDisabled: false });
      fixture.detectChanges();

      const editButton = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(editButton.disabled).toBeFalsy();
    });

    it('should disable edit button when editButtonDisabled is true', () => {
      fixture.componentRef.setInput('config', { ...mockConfig, editButtonDisabled: true });
      fixture.detectChanges();

      const editButton = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(editButton.disabled).toBeTruthy();
    });
  });

  describe('Button Functionality', () => {
    it('should call deleteButtonClick when delete button is clicked', () => {
      const deleteClickSpy = jest.fn();
      fixture.componentRef.setInput('config', { ...mockConfig, deleteButtonClick: deleteClickSpy });
      fixture.detectChanges();

      const deleteButton = fixture.nativeElement.querySelector('button[color="accent"]');
      deleteButton.click();

      expect(deleteClickSpy).toHaveBeenCalledTimes(1);
    });

    it('should call editButtonClick when edit button is clicked', () => {
      const editClickSpy = jest.fn();
      fixture.componentRef.setInput('config', { ...mockConfig, editButtonClick: editClickSpy });
      fixture.detectChanges();

      const editButton = fixture.nativeElement.querySelector('button[color="primary"]');
      editButton.click();

      expect(editClickSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined click callbacks gracefully', () => {
      fixture.componentRef.setInput('config', {
        ...mockConfig,
        deleteButtonClick: undefined,
        editButtonClick: undefined,
      });
      fixture.detectChanges();

      const deleteButton = fixture.nativeElement.querySelector('button[color="accent"]');
      const editButton = fixture.nativeElement.querySelector('button[color="primary"]');

      expect(() => {
        deleteButton.click();
        editButton.click();
      }).not.toThrow();
    });
  });

  describe('Button Rendering', () => {
    it('should render delete button with correct icon', () => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();

      const deleteButton = fixture.nativeElement.querySelector('button[color="accent"] mat-icon');
      expect(deleteButton.textContent.trim()).toBe('delete');
    });

    it('should render edit button with correct icon', () => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();

      const editButton = fixture.nativeElement.querySelector('button[color="primary"] mat-icon');
      expect(editButton.textContent.trim()).toBe('edit');
    });

    it('should render both buttons as mat-fab', () => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[mat-fab]');
      expect(buttons.length).toBe(2);
    });
  });
});
