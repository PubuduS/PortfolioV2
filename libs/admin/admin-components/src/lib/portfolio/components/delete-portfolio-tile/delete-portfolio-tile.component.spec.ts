import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';

import { IProjectCard } from '@portfolio-v2/state/dataModels';
import { callComponentMethod } from '@portfolio-v2/shared/test-helpers';
import { ProjectCardType } from '@portfolio-v2/admin/shared/components';
import { PortfolioWriter } from '../../services/portfolio-writer.service';
import { DeletePortfolioTileComponent } from './delete-portfolio-tile.component';

describe('DeletePortfolioTileComponent', () => {
  let component: DeletePortfolioTileComponent;
  let fixture: ComponentFixture<DeletePortfolioTileComponent>;
  let writer: jest.Mocked<PortfolioWriter>;

  const mockProject: IProjectCard = {
    id: 1,
    heading: 'Test Project',
    description: 'Test project description',
    tools: 'Test tools',
    imageURL: 'https://example.com/image.jpg',
  };

  const mockProjectData = {
    recordId: mockProject.id,
    type: ProjectCardType.standard,
  };

  beforeEach(async () => {
    writer = createSpyObj(PortfolioWriter);
    writer.removeStandardProject.mockResolvedValue(undefined);
    writer.removeFeaturedProject.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [DeletePortfolioTileComponent],
      providers: [
        provideMockStore({
          initialState: {
            projectCards: [mockProject],
            featuredProjectCards: [mockProject],
          },
        }),
        { provide: MAT_DIALOG_DATA, useValue: mockProjectData },
        { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
        { provide: PortfolioWriter, useValue: writer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeletePortfolioTileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the dialog record', () => {
    expect(component.data).toBe(mockProjectData);
    expect(component.data.recordId).toBe(mockProject.id);
    expect(component.data.type).toBe(ProjectCardType.standard);
  });

  it('should not delete when the dialog has no record id', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DeletePortfolioTileComponent],
      providers: [
        provideMockStore({}),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
        { provide: PortfolioWriter, useValue: writer },
      ],
    });

    const newComponent = TestBed.createComponent(DeletePortfolioTileComponent);
    callComponentMethod(newComponent.componentInstance, 'deleteTile');

    expect(writer.removeStandardProject).not.toHaveBeenCalled();
  });

  it('should close after the tile records are removed', async () => {
    callComponentMethod(component, 'deleteTile');
    await fixture.whenStable();

    expect(writer.removeStandardProject).toHaveBeenCalledWith(mockProject.id);
    expect(component.dialogRef.close).toHaveBeenCalled();
    expect(component['isOverallSuccess']).toBe(true);
  });

  it('should stay open when a database delete fails', async () => {
    writer.removeStandardProject.mockRejectedValue(new Error('permission'));

    callComponentMethod(component, 'deleteTile');
    await fixture.whenStable();

    expect(component.dialogRef.close).not.toHaveBeenCalled();
    expect(component['isOverallSuccess']).toBe(false);
  });

  describe('when the record is featured', () => {
    let featuredComponent: DeletePortfolioTileComponent;
    let featuredFixture: ComponentFixture<DeletePortfolioTileComponent>;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [DeletePortfolioTileComponent],
        providers: [
          provideMockStore({
            initialState: {
              featuredProjectCards: [mockProject],
            },
          }),
          {
            provide: MAT_DIALOG_DATA,
            useValue: { recordId: mockProject.id, type: ProjectCardType.featured },
          },
          { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
          { provide: PortfolioWriter, useValue: writer },
        ],
      }).compileComponents();

      featuredFixture = TestBed.createComponent(DeletePortfolioTileComponent);
      featuredComponent = featuredFixture.componentInstance;
      await featuredFixture.whenStable();
    });

    it('should close after the featured record is removed', async () => {
      callComponentMethod(featuredComponent, 'deleteFeaturedProject');
      await featuredFixture.whenStable();

      expect(writer.removeFeaturedProject).toHaveBeenCalledWith(mockProject.id);
      expect(featuredComponent.dialogRef.close).toHaveBeenCalled();
    });
  });
});
