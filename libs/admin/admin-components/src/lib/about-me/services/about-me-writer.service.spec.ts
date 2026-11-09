import { createSpyObj } from 'jest-createspyobj';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { IAboutMe } from '@portfolio-v2/state/dataModels';
import { AboutMeWriter } from './about-me-writer.service';

const aboutMe: IAboutMe = {
  id: 1,
  imageSrc: 'https://example.com/photo.webp',
  intro: ['Hello'],
  subHeadingIntro: 'Engineer',
  leftPoints: ['One'],
  rightPoints: ['Two'],
};

describe('AboutMeWriter', () => {
  it('should set the single about-me document', async () => {
    const setData = createSpyObj(SetDataService);
    const auth = createSpyObj(AuthService);
    setData.commit.mockResolvedValue(undefined);
    auth.isUserLoggedIn.mockReturnValue(true);
    const writer = new AboutMeWriter(setData, auth);

    await writer.save(aboutMe);

    expect(setData.commit).toHaveBeenCalledWith([
      { kind: 'set', path: 'about-me-section/part-01/', value: aboutMe },
    ]);
  });
});
