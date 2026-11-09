import { createSpyObj } from 'jest-createspyobj';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { IExperience } from '@portfolio-v2/state/dataModels';
import {
  ExperienceWriteError,
  ExperienceWriter,
} from './experience-writer.service';

const job: IExperience = {
  id: 2,
  position: 'Engineer',
  employer: 'Acme',
  timePeriod: '2020 - 2022',
  shortDescription: 'Built software',
  points: ['Shipped the app'],
  startDate: '2020-01-01',
  endDate: 'present',
  isCurrent: true,
};

describe('ExperienceWriter', () => {
  let setData: jest.Mocked<SetDataService>;
  let auth: jest.Mocked<AuthService>;
  let writer: ExperienceWriter;

  beforeEach(() => {
    setData = createSpyObj(SetDataService);
    auth = createSpyObj(AuthService);
    setData.commit.mockResolvedValue(undefined);
    auth.isUserLoggedIn.mockReturnValue(true);
    writer = new ExperienceWriter(setData, auth);
  });

  it('should not commit when nobody is signed in', async () => {
    auth.isUserLoggedIn.mockReturnValue(false);

    await expect(writer.save(job)).rejects.toBeInstanceOf(ExperienceWriteError);
    expect(setData.commit).not.toHaveBeenCalled();
  });

  it('should set the padded experience document and leave present as stored', async () => {
    await writer.save(job);

    expect(setData.commit).toHaveBeenCalledWith([
      { kind: 'set', path: 'experience-section/experience02/', value: job },
    ]);
  });
});
