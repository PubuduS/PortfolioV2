import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { FlowerAnimationComponent } from './flower-animation.component';

describe('FlowerAnimationComponent', () => {
  let component: FlowerAnimationComponent;
  let fixture: ComponentFixture<FlowerAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowerAnimationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FlowerAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
