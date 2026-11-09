import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';

import { SetDataService } from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import { ISocialInfo } from '@portfolio-v2/state/dataModels';
import { socialMediaSelector } from '@portfolio-v2/state/selectors';
import { AdminContactComponent } from './admin-contact.component';

describe('AdminContactComponent', () => {
  let fixture: ComponentFixture<AdminContactComponent>;
  let store: MockStore;
  let setData: jest.Mocked<SetDataService>;
  const storedLinks: ISocialInfo[] = [
    { id: 1, media: 'https://www.linkedin.com/in/ada', mediaIcon: 'fa-linkedin' },
    { id: 2, media: 'https://github.com/ada', mediaIcon: 'fa-github' },
    { id: 3, media: 'ada@example.test', mediaIcon: 'fa-envelope' },
  ];

  function field(name: 'linkedin' | 'github' | 'email'): HTMLInputElement {
    const input = fixture.nativeElement.querySelector(`#${name}`) as HTMLInputElement | null;
    if (!input) {
      throw new Error(`missing ${name}`);
    }
    return input;
  }

  function typeInto(name: 'linkedin' | 'github' | 'email', value: string): void {
    const input = field(name);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function save(): void {
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as
      HTMLButtonElement | null;
    if (!button) {
      throw new Error('missing save button');
    }
    button.click();
  }

  beforeEach(async () => {
    setData = createSpyObj(SetDataService);
    setData.commit.mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [AdminContactComponent],
      providers: [
        provideMockStore(),
        { provide: SetDataService, useValue: setData },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    jest.spyOn(store, 'dispatch');
    store.overrideSelector(socialMediaSelector, storedLinks);
    fixture = TestBed.createComponent(AdminContactComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should open the contact-link listener when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.socialMediaInformationStateConnect());
  });

  it('should fill the three fields from the stored links', () => {
    expect(field('linkedin').value).toBe('https://www.linkedin.com/in/ada');
    expect(field('github').value).toBe('https://github.com/ada');
    expect(field('email').value).toBe('ada@example.test');
  });

  it('should keep an edited form when a later store update arrives', () => {
    typeInto('email', 'edited@example.test');
    store.overrideSelector(socialMediaSelector, [
      ...storedLinks.slice(0, 2),
      { id: 3, media: 'replacement@example.test', mediaIcon: 'fa-envelope' },
    ]);
    store.refreshState();
    fixture.detectChanges();

    expect(field('email').value).toBe('edited@example.test');
  });

  describe('when the links are saved', () => {
    it('should write the three records and show a confirmation', async () => {
      typeInto('linkedin', 'https://www.linkedin.com/in/edited');
      typeInto('github', 'https://github.com/edited');
      typeInto('email', 'edited@example.test');
      save();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(setData.commit).toHaveBeenCalledWith([
        {
          kind: 'set',
          path: 'social-infor-section/social-01',
          value: {
            id: 1,
            media: 'https://www.linkedin.com/in/edited',
            mediaIcon: 'fa-linkedin',
          },
        },
        {
          kind: 'set',
          path: 'social-infor-section/social-02',
          value: { id: 2, media: 'https://github.com/edited', mediaIcon: 'fa-github' },
        },
        {
          kind: 'set',
          path: 'social-infor-section/social-03',
          value: { id: 3, media: 'edited@example.test', mediaIcon: 'fa-envelope' },
        },
      ]);
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.socialMediaInformationStateUpdated({
        socialInfor: [
          {
            id: 1,
            media: 'https://www.linkedin.com/in/edited',
            mediaIcon: 'fa-linkedin',
          },
          { id: 2, media: 'https://github.com/edited', mediaIcon: 'fa-github' },
          { id: 3, media: 'edited@example.test', mediaIcon: 'fa-envelope' },
        ],
      }));
      expect(fixture.nativeElement.querySelector('mat-icon.success')).not.toBeNull();
    });
  });

  describe('when a field is not a usable address', () => {
    it('should explain the problem and leave the records unchanged', async () => {
      typeInto('github', 'not-a-url');
      save();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(setData.commit).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain(
        'Enter a full GitHub address, starting with https://',
      );
    });
  });

  describe('when the write fails', () => {
    it('should say the links were not saved', async () => {
      setData.commit.mockRejectedValue(new Error('unavailable'));
      save();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'The contact links could not be saved. Try again.',
      );
      expect(fixture.nativeElement.querySelector('mat-icon.success')).toBeNull();
    });
  });
});

describe('AdminContactComponent when the links arrive after the page opens', () => {
  let fixture: ComponentFixture<AdminContactComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminContactComponent],
      providers: [
        provideMockStore(),
        { provide: SetDataService, useValue: createSpyObj(SetDataService) },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(socialMediaSelector, undefined);
    fixture = TestBed.createComponent(AdminContactComponent);
    fixture.detectChanges();
  });

  it('should fill the form from the first stored links', () => {
    expect(fixture.nativeElement.querySelector('#email').value).toBe('');

    store.overrideSelector(socialMediaSelector, [
      { id: 1, media: 'https://www.linkedin.com/in/ada', mediaIcon: 'fa-linkedin' },
      { id: 2, media: 'https://github.com/ada', mediaIcon: 'fa-github' },
      { id: 3, media: 'ada@example.test', mediaIcon: 'fa-envelope' },
    ]);
    store.refreshState();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#linkedin').value).toBe(
      'https://www.linkedin.com/in/ada',
    );
    expect(fixture.nativeElement.querySelector('#email').value).toBe('ada@example.test');
  });
});
