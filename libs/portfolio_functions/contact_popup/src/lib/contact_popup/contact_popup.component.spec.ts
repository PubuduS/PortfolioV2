import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactPopupComponent } from './contact_popup.component';

describe('ContactPopupComponent', () => {
  let component: ContactPopupComponent;
  let fixture: ComponentFixture<ContactPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
