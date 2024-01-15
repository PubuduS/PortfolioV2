import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherDisplayComponent } from './weather_display.component';

describe('WeatherDisplayComponent', () => {
  let component: WeatherDisplayComponent;
  let fixture: ComponentFixture<WeatherDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
