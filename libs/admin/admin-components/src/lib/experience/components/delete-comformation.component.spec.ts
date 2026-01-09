import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { createSpyObj } from 'jest-createspyobj';

import { IExperience } from '@portfolio-v2/state/dataModels';
import { DeleteComformationComponent } from './delete-comformation.component';

describe('DeleteComformationComponent', () => {
  let component: DeleteComformationComponent;
  let fixture: ComponentFixture<DeleteComformationComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<DeleteComformationComponent>>;
  let mockData: { record: IExperience };

  beforeEach(async () => {
    mockDialogRef = createSpyObj(MatDialogRef<DeleteComformationComponent>);

    mockData = {
      record: {
        id: 1,
        position: 'Test Position',
        employer: 'Test Employer',
        timePeriod: '2023 - Present',
        shortDescription: 'Test Description',
        points: ['Point 1', 'Point 2'],
        startDate: '2023-01-01',
        endDate: 'present',
        isCurrent: true,
      },
    };

    await TestBed.configureTestingModule({
      imports: [DeleteComformationComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteComformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with record data', () => {
    // Access protected properties through component instance
    expect((component as any).points).toEqual(['Point 1', 'Point 2']);
    expect((component as any).records.length).toBeGreaterThan(0);
  });

  it('should handle undefined record gracefully', () => {
    // Test with undefined record
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DeleteComformationComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { record: undefined } },
      ],
    }).compileComponents();

    const testFixture = TestBed.createComponent(DeleteComformationComponent);
    const testComponent = testFixture.componentInstance;
    testFixture.detectChanges();

    expect((testComponent as any).points).toEqual([]);
    expect((testComponent as any).records).toEqual([]);
  });
});
