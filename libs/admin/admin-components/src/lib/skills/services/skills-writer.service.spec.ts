import { createSpyObj } from 'jest-createspyobj';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { ISkills } from '@portfolio-v2/state/dataModels';
import { SkillsWriter } from './skills-writer.service';

const skills: ISkills = {
  id: 1,
  intro: 'Languages',
  languagesCol1: { TypeScript: 1 },
  languagesCol2: { Python: 1 },
  toolHeading: 'Tools',
  leftSubHeading: 'Frameworks',
  framework: ['Angular'],
  rightSubHeading: 'Software',
  software: ['Git'],
};

describe('SkillsWriter', () => {
  it('should set the single skills document', async () => {
    const setData = createSpyObj(SetDataService);
    const auth = createSpyObj(AuthService);
    setData.commit.mockResolvedValue(undefined);
    auth.isUserLoggedIn.mockReturnValue(true);
    const writer = new SkillsWriter(setData, auth);

    await writer.save(skills);

    expect(setData.commit).toHaveBeenCalledWith([
      { kind: 'set', path: 'skills-section/latest/', value: skills },
    ]);
  });
});
