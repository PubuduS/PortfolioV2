import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { FormBuilder } from '@angular/forms';

import {
  GetDataService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { aboutMeSelector } from '@portfolio-v2/state/selectors';
import { IAboutMe } from '@portfolio-v2/state/dataModels';
import { UploadPhotoComponent } from './upload-photo.component';

describe('UploadPhotoComponent', () => {
  let component: UploadPhotoComponent;
  let fixture: ComponentFixture<UploadPhotoComponent>;
  let store: MockStore;
  let mockSetDataService: jest.Mocked<SetDataService>;
  let mockGetDataService: jest.Mocked<GetDataService>;
  const mockData: IAboutMe = {
    id: 1,
    imageSrc: 'some url',
    intro: ['some intro1', 'another intro'],
    subHeadingIntro: 'sub heading intro',
    leftPoints: ['point 1', 'point 2', 'point 3'],
    rightPoints: ['point 4', 'point 5', 'point 6'],
    link: 'some link',
  };

  beforeEach(async () => {
    mockSetDataService = createSpyObj(SetDataService);
    mockGetDataService = createSpyObj(GetDataService);
    await TestBed.configureTestingModule({
      imports: [UploadPhotoComponent],
      providers: [
        provideMockStore(),
        FormBuilder,
        {
          provide: SetDataService,
          useValue: mockSetDataService,
        },
        {
          provide: GetDataService,
          useValue: mockGetDataService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(aboutMeSelector, mockData);
    fixture = TestBed.createComponent(UploadPhotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
