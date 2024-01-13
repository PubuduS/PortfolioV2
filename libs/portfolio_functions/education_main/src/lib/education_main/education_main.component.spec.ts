import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EducationMainComponent } from './education_main.component';

describe('EducationMainComponent', () => {
  let component: EducationMainComponent;
  let fixture: ComponentFixture<EducationMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducationMainComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EducationMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
