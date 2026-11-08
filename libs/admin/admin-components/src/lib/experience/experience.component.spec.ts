import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { MockComponents } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import { experienceSelector } from '@portfolio-v2/state/selectors';
import { IExperience } from '@portfolio-v2/state/dataModels';
import { AdminExperienceComponent } from './experience.component';
import { DeleteComformationComponent } from './components/delete-comformation.component';

describe('AdminExperienceComponent', () => {
  let component: AdminExperienceComponent;
  let fixture: ComponentFixture<AdminExperienceComponent>;
  let store: MockStore;
  let mockUtilityService: jest.Mocked<UtilityService>;
  let mockSetDataService: jest.Mocked<SetDataService>;
  const mockData: IExperience[] = [{
    id: 1,
    position: 'some position',
    employer: 'some employer',
    timePeriod: '2024 - Present',
    shortDescription: 'shor description',
    points: ['point 1', 'point 2', 'point 3'],
    startDate: '2021-03-12',
    endDate: '2023-03-12',
    isCurrent: false,
  }];

  beforeEach(async () => {
    mockUtilityService = createSpyObj(UtilityService);
    mockSetDataService = createSpyObj(SetDataService);
    await TestBed.configureTestingModule({
      imports: [
        AdminExperienceComponent,
        MockComponents(DeleteComformationComponent),
        NoopAnimationsModule,
      ],
      providers: [
        provideMockStore(),
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: SetDataService,
          useValue: mockSetDataService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    jest.spyOn(store, 'dispatch');
    store.overrideSelector(experienceSelector, mockData);
    fixture = TestBed.createComponent(AdminExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the experience listener when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.experienceStateConnect());
  });

  describe('when the form is filled', () => {
    beforeEach(() => {
      mockUtilityService.breakStringToParagraphs.mockReturnValue(['Shipped the app']);
      mockUtilityService.getPaddedDigits.mockImplementation(
        (value: number, width: number) => String(value).padStart(width, '0'),
      );
      mockSetDataService.setRecord.mockReturnValue(of('successfull'));
      mockSetDataService.deleteRecord.mockReturnValue(of('successfull'));
      const fields = component['experienceForm'];
      fields.position().value.set('Engineer');
      fields.employer().value.set('Acme');
      fields.startDate().value.set(new Date(2020, 0, 1));
      fields.endDate().value.set(new Date(2022, 5, 1));
      fields.isCurrent().value.set(true);
      fields.timePeriod().value.set('2020 - 2022 (2 Years)');
      fields.shortDescription().value.set('Built software');
      fields.points().value.set('Shipped the app');
    });

    it('should not save while required fields are empty', () => {
      component['clearForm']();

      component['addExperience']();

      expect(mockSetDataService.setRecord).not.toHaveBeenCalled();
    });

    it('should save a new current job', () => {
      component['addExperience']();
      let saved = false;
      component['isAddSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(true);
      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'experience-section/experience02/',
        expect.objectContaining({
          id: 2,
          position: 'Engineer',
          endDate: 'present',
          isCurrent: true,
          timePeriod: '2020 - 2022',
          points: ['Shipped the app'],
        }),
      );
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.experienceStateUpdated({
        experiences: expect.arrayContaining([
          expect.objectContaining({ id: 2, employer: 'Acme' }),
        ]),
      }));
    });

    it('should save the first job when the list is empty', () => {
      store.overrideSelector(experienceSelector, []);
      store.refreshState();

      component['addExperience']();
      component['isAddSuccess'].subscribe();

      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'experience-section/experience01/',
        expect.objectContaining({ id: 1 }),
      );
    });

    it('should replace the selected job and keep a dated end', () => {
      const fields = component['experienceForm'];
      fields.isCurrent().value.set(false);
      fields.timePeriod().value.set('');

      component['editExperience']();
      let saved = false;
      component['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(true);
      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'experience-section/experience01/',
        expect.objectContaining({
          id: 1,
          endDate: '2022-06-01',
          timePeriod: '',
        }),
      );
    });

    it('should leave the record when the save does not succeed', () => {
      mockSetDataService.setRecord.mockReturnValue(of('failed'));

      component['editExperience']();
      let saved = true;
      component['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(false);
    });
  });

  describe('when a job is removed', () => {
    beforeEach(() => {
      mockUtilityService.getPaddedDigits.mockImplementation(
        (value: number, width: number) => String(value).padStart(width, '0'),
      );
    });

    it('should do nothing when nothing is selected', () => {
      component.experience = undefined;

      component['deleteExperience']();

      expect(mockSetDataService.deleteRecord).not.toHaveBeenCalled();
    });

    it('should do nothing when edit is asked with nothing selected', () => {
      component.experience = undefined;

      component['editExperience']();

      expect(mockSetDataService.setRecord).not.toHaveBeenCalled();
    });

    it('should drop the selected job after a successful delete', () => {
      mockSetDataService.deleteRecord.mockReturnValue(of('successfull'));

      component['deleteExperience']();
      let removed = false;
      component['isDeleteSuccess'].subscribe((value) => {
        removed = value;
      });

      expect(removed).toBe(true);
      expect(mockSetDataService.deleteRecord).toHaveBeenCalledWith('experience-section/experience01/');
      expect(component.experience).toBeUndefined();
      expect(component['selectedJob']).toBe('Mock Employer');
    });

    it('should keep the selection when the delete fails', () => {
      mockSetDataService.deleteRecord.mockReturnValue(of('failed'));

      component['deleteExperience']();
      let removed = true;
      component['isDeleteSuccess'].subscribe((value) => {
        removed = value;
      });

      expect(removed).toBe(false);
      expect(component.experience?.id).toBe(1);
    });

    it('should still ask storage to delete an id that is not in the list', () => {
      mockSetDataService.deleteRecord.mockReturnValue(of('successfull'));
      component.experience = { ...mockData[0], id: 9 };

      component['deleteExperience']();
      component['isDeleteSuccess'].subscribe();

      expect(mockSetDataService.deleteRecord).toHaveBeenCalledWith('experience-section/experience09/');
    });

    it('should delete only after the confirmation dialog accepts', () => {
      mockSetDataService.deleteRecord.mockReturnValue(of('successfull'));
      jest.spyOn(component['dialog'], 'open').mockReturnValue({
        afterClosed: () => of(true),
      } as ReturnType<MatDialog['open']>);

      component['openDeleteConfirmation']();

      expect(component['dialog'].open).toHaveBeenCalledWith(DeleteComformationComponent, {
        data: { record: component.experience },
      });
      expect(mockSetDataService.deleteRecord).toHaveBeenCalled();
    });

    it('should keep the job when the confirmation dialog is dismissed', () => {
      jest.spyOn(component['dialog'], 'open').mockReturnValue({
        afterClosed: () => of(false),
      } as ReturnType<MatDialog['open']>);

      component['openDeleteConfirmation']();

      expect(mockSetDataService.deleteRecord).not.toHaveBeenCalled();
    });
  });

  describe('when dates and the form are edited', () => {
    it('should ignore the same start instant and store a different one', () => {
      const current = component['experienceForm'].startDate().value();
      if (current === null) {
        throw new Error('expected a start date');
      }
      const sameInstant = new Date(current.getTime());

      component['setStart'](current);
      component['setStart'](sameInstant);
      expect(component['experienceForm'].startDate().value()).toBe(current);

      const next = new Date(2019, 4, 2);
      component['setStart'](next);
      expect(component['experienceForm'].startDate().value()).toBe(next);

      component['setStart'](null);
      component['setStart'](null);
      expect(component['experienceForm'].startDate().value()).toBeNull();
    });

    it('should store a different end date', () => {
      const next = new Date(2024, 1, 2);

      component['setEnd'](next);
      component['setEnd'](next);

      expect(component['experienceForm'].endDate().value()).toBe(next);
    });

    it('should store the current-job flag', () => {
      component['setCurrent'](true);

      expect(component['experienceForm'].isCurrent().value()).toBe(true);
    });

    it('should leave the time period alone when a date is missing or it already matches', () => {
      component['setStart'](null);
      component['calculateTimePeriod']();

      component['setStart'](new Date(2020, 0, 1));
      component['setEnd'](new Date(2022, 0, 1));
      component['calculateTimePeriod']();
      component['calculateTimePeriod']();

      expect(component['experienceForm'].timePeriod().value()).toBe('2020 - 2022');
    });

    it('should reset the editor', () => {
      component['clearForm']();

      expect(component['experienceForm'].employer().value()).toBe('');
      expect(component['experienceForm'].isCurrent().value()).toBe(false);
      expect(component['experienceForm'].startDate().value()).toBeNull();
    });

    it('should show a required error only after the field is touched', () => {
      component['clearForm']();
      const {position} = component['experienceForm'];

      expect(component['hasError'](position, 'required')).toBe(false);

      position().markAsTouched();

      expect(component['hasError'](position, 'required')).toBe(true);
      expect(component['hasError'](position, 'other')).toBe(false);
    });

    it('should count a short job as one year and a dateless job as the default', () => {
      component.displaySelected({
        ...mockData[0],
        startDate: '2023-01-01',
        endDate: '2023-02-01',
      });

      expect(component.yearsOfExperience().endsWith(' Year')).toBe(true);

      component.displaySelected({
        ...mockData[0],
        startDate: '',
        endDate: '',
      });

      expect(component.yearsOfExperience()).toBe('1 Year');
    });
  });

  describe('when the job list has not loaded', () => {
    it('should stop before assigning a new id', () => {
      store.overrideSelector(experienceSelector, undefined);
      store.refreshState();
      const fields = component['experienceForm'];
      fields.position().value.set('Engineer');
      fields.employer().value.set('Acme');
      fields.startDate().value.set(new Date(2020, 0, 1));
      fields.endDate().value.set(new Date(2022, 5, 1));
      fields.isCurrent().value.set(true);
      fields.timePeriod().value.set('2020 - 2022');
      fields.shortDescription().value.set('Built software');
      fields.points().value.set('Shipped the app');

      expect(() => component['addExperience']()).toThrow(TypeError);
    });
  });
});

describe('AdminExperienceComponent when the record arrives after the page opens', () => {
  let fixture: ComponentFixture<AdminExperienceComponent>;
  let store: MockStore;

  beforeEach(async () => {
    const utility = createSpyObj(UtilityService);
    utility.seperateSentences.mockReturnValue('point 1');
    await TestBed.configureTestingModule({
      imports: [
        AdminExperienceComponent,
        MockComponents(DeleteComformationComponent),
        NoopAnimationsModule,
      ],
      providers: [
        provideMockStore(),
        { provide: UtilityService, useValue: utility },
        { provide: SetDataService, useValue: createSpyObj(SetDataService) },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(experienceSelector, []);
    fixture = TestBed.createComponent(AdminExperienceComponent);
    fixture.detectChanges();
  });

  it('should fill the form from the first stored job', () => {
    expect(fixture.componentInstance['experienceForm'].employer().value()).toBe('');

    store.overrideSelector(experienceSelector, [{
      id: 1,
      position: 'some position',
      employer: 'some employer',
      timePeriod: '2024 - Present',
      shortDescription: 'short description',
      points: ['point 1'],
      startDate: '2021-03-12',
      endDate: '2023-03-12',
      isCurrent: false,
    }]);
    store.refreshState();
    fixture.detectChanges();

    const form = fixture.componentInstance['experienceForm'];
    expect(form.employer().value()).toBe('some employer');
    expect(form.position().value()).toBe('some position');
  });
});
