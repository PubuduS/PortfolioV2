import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { createSpyObj } from 'jest-createspyobj';

import { GetDataService } from '@portfolio-v2/shared/services';
import { AboutMeComponent } from './about_me.component';

describe('AboutMeComponent', () => {
  let component: AboutMeComponent;
  let fixture: ComponentFixture<AboutMeComponent>;
  let dataService: jest.Mocked<GetDataService>;

  beforeEach(async () => {
    dataService = createSpyObj(GetDataService);
    await TestBed.configureTestingModule({
      imports: [AboutMeComponent],
      providers: [
        {
          provide: GetDataService,
          useValue: dataService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
