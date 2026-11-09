import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { createSpyObj } from 'jest-createspyobj';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { ContactMailService } from '@portfolio-v2/shared/services';
import { ISocialInfo } from '@portfolio-v2/state/dataModels';
import { StateActions } from '@portfolio-v2/state';
import { socialMediaSelector } from '@portfolio-v2/state/selectors';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let store: MockStore;
  let mail: jest.Mocked<ContactMailService>;
  const mockData: ISocialInfo[] = [
    {
      id: 1,
      media: 'https://www.linkedin.com/in/ada',
      mediaIcon: 'fa-linkedin',
    },
    {
      id: 3,
      media: 'ada@example.test',
      mediaIcon: 'fa-envelope',
    },
  ];

  function setField(selector: string, value: string): void {
    const field = fixture.nativeElement.querySelector(selector) as
      HTMLInputElement | HTMLTextAreaElement | null;
    if (!field) {
      throw new Error(`missing ${selector}`);
    }
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function fillForm(): void {
    setField('input[placeholder="Your Email Address"]', 'ada@example.com');
    setField('input[placeholder="Your Name"]', 'Ada');
    setField('textarea', 'Hello from the contact form.');
    fixture.detectChanges();
  }

  function sendButton(): HTMLButtonElement {
    const button = fixture.nativeElement.querySelector('button.submit-btn') as
      HTMLButtonElement | null;
    if (!button) {
      throw new Error('missing send button');
    }
    return button;
  }

  function submit(): void {
    sendButton().click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    mail = createSpyObj(ContactMailService);
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideMockStore(),
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: ContactMailService, useValue: mail },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(socialMediaSelector, mockData);
    jest.spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should connect social links when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.socialMediaInformationStateConnect());
  });

  it('should show the stored email address', () => {
    const link = fixture.nativeElement.querySelector('a[href="mailto:ada@example.test"]');
    expect(link?.textContent?.trim()).toBe('ada@example.test');
  });

  it('should keep send disabled until the form is valid', () => {
    const button = sendButton();
    expect(button.disabled).toBe(true);
    fillForm();
    expect(button.disabled).toBe(false);
  });

  it('should keep the fax field out of the layout', () => {
    const trap = fixture.nativeElement.querySelector('.contact-trap');
    expect(trap).not.toBeNull();
    expect(trap.querySelector('input')?.getAttribute('tabindex')).toBe('-1');
  });

  describe('when the message is accepted', () => {
    it('should confirm the send and clear the form', async () => {
      mail.sendMessage.mockResolvedValue('sent');
      fillForm();
      submit();
      await fixture.whenStable();
      fixture.detectChanges();
      const nativeElement = fixture.nativeElement as HTMLElement;
      const email = nativeElement.querySelector<HTMLInputElement>('input[type="email"]');
      const confirmation = 'Your message is on its way. I will reply soon.';
      expect(nativeElement.textContent).toContain(confirmation);
      expect(email?.value).toBe('');
      expect(mail.sendMessage).toHaveBeenCalledWith({
        email: 'ada@example.com',
        name: 'Ada',
        message: 'Hello from the contact form.',
        faxNumber: '',
      });
    });
  });

  describe('when the local function accepts the message without emailing', () => {
    it('should say that no email was sent and clear the form', async () => {
      mail.sendMessage.mockResolvedValue('dry-run');
      fillForm();
      submit();
      await fixture.whenStable();
      fixture.detectChanges();
      const nativeElement = fixture.nativeElement as HTMLElement;
      const email = nativeElement.querySelector<HTMLInputElement>('input[type="email"]');
      const note = 'This local session accepted the message without sending an email.';
      expect(nativeElement.textContent).toContain(note);
      expect(email?.value).toBe('');
    });
  });

  describe('when the send fails', () => {
    it('should tell the visitor to email directly and keep the form', async () => {
      mail.sendMessage.mockResolvedValue('failed');
      fillForm();
      submit();
      await fixture.whenStable();
      fixture.detectChanges();
      const nativeElement = fixture.nativeElement as HTMLElement;
      const email = nativeElement.querySelector<HTMLInputElement>('input[type="email"]');
      const note = 'The message could not be sent. Email me directly and I will get back to you.';
      expect(nativeElement.textContent).toContain(note);
      expect(email?.value).toBe('ada@example.com');
    });
  });

  describe('when too many messages were sent', () => {
    it('should ask the visitor to wait and keep the form', async () => {
      mail.sendMessage.mockResolvedValue('limited');
      fillForm();
      submit();
      await fixture.whenStable();
      fixture.detectChanges();
      const nativeElement = fixture.nativeElement as HTMLElement;
      const email = nativeElement.querySelector<HTMLInputElement>('input[type="email"]');
      const waiting = 'Too many messages were sent just now.';
      expect(nativeElement.textContent).toContain(waiting);
      expect(email?.value).toBe('ada@example.com');
    });
  });
});
