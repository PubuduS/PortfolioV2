import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartyModeComponent } from './party_mode.component';

describe('PartyModeComponent', () => {
  let component: PartyModeComponent;
  let fixture: ComponentFixture<PartyModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyModeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PartyModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
