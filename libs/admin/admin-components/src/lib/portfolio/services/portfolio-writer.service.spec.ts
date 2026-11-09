import { createSpyObj } from 'jest-createspyobj';
import { of } from 'rxjs';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  IProjectCard,
  IProjectView,
} from '@portfolio-v2/state/dataModels';
import {
  PortfolioWriteError,
  PortfolioWriter,
} from './portfolio-writer.service';

const tile: IProjectView = {
  id: 3,
  imageURL: 'https://example.com/icon.webp',
  viewHeading: 'Sorting Algorithm',
  viewDescription: 'A visual sort',
};

const card: IProjectCard = {
  id: 3,
  heading: 'Sorting Algorithm',
  description: 'A visual sort',
  tools: 'Angular',
  imageURL: 'https://example.com/card.webp',
};

describe('PortfolioWriter', () => {
  let setData: jest.Mocked<SetDataService>;
  let auth: jest.Mocked<AuthService>;
  let writer: PortfolioWriter;

  beforeEach(() => {
    setData = createSpyObj(SetDataService);
    auth = createSpyObj(AuthService);
    setData.commit.mockResolvedValue(undefined);
    setData.deleteFileFromStorage.mockReturnValue(of('removed'));
    auth.isUserLoggedIn.mockReturnValue(true);
    writer = new PortfolioWriter(setData, auth);
  });

  it('should refuse a tile save when nobody is signed in', async () => {
    auth.isUserLoggedIn.mockReturnValue(false);

    await expect(writer.saveTile(tile)).rejects.toMatchObject({ reason: 'unauthenticated' });
    expect(setData.commit).not.toHaveBeenCalled();
  });

  it('should set the tile document at the padded icon path', async () => {
    await writer.saveTile(tile);

    expect(setData.commit).toHaveBeenCalledWith([
      { kind: 'set', path: 'project-icon-section/project-03/', value: tile },
    ]);
  });

  it('should delete a new tile document and then its icon file', async () => {
    await writer.removeNewTile(3);

    expect(setData.commit).toHaveBeenCalledWith([
      { kind: 'delete', path: 'project-icon-section/project-03/' },
    ]);
    expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(
      'portfolio/portfolio-tiles/ID-03-Icon.webp',
    );
  });

  it('should set a standard card and a featured card in their own collections', async () => {
    await writer.saveCard(card, false);
    await writer.saveCard(card, true);

    expect(setData.commit).toHaveBeenNthCalledWith(1, [
      { kind: 'set', path: 'project-data-section/project-03/', value: card },
    ]);
    expect(setData.commit).toHaveBeenNthCalledWith(2, [
      { kind: 'set', path: 'featured-project-section/project-03/', value: card },
    ]);
  });

  it('should merge only the heading on the standard card', async () => {
    await writer.patchCardHeading(3, 'New heading');

    expect(setData.commit).toHaveBeenCalledWith([
      {
        kind: 'merge',
        path: 'project-data-section/project-03/',
        value: { heading: 'New heading' },
      },
    ]);
  });

  it('should still remove a standard project when the files are already gone', async () => {
    setData.deleteFileFromStorage.mockReturnValue(of('error storage/object-not-found'));

    await expect(writer.removeStandardProject(3)).resolves.toBeUndefined();

    expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(
      'portfolio/portfolio-tiles/ID-03-Icon.webp',
    );
    expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(
      'portfolio/project-screenshots/normal/ID-03-Screenshot.webp',
    );
    expect(setData.commit).toHaveBeenCalledWith([
      { kind: 'delete', path: 'project-icon-section/project-03/' },
      { kind: 'delete', path: 'project-data-section/project-03/' },
    ]);
  });

  it('should keep the featured image delete path without a trailing slash', async () => {
    await writer.removeFeaturedProject(3);

    expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(
      'portfolio/project-screenshots/featured/ID-03-Screenshot.webp',
    );
    expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(
      'portfolio/featured-projects/ID-03-Image.webp',
    );
    expect(setData.commit).toHaveBeenCalledWith([
      { kind: 'delete', path: 'featured-project-section/project-03/' },
    ]);
  });

  it('should report a failed batch and keep the cause', async () => {
    const cause = new Error('unavailable');
    setData.commit.mockRejectedValue(cause);

    await expect(writer.saveTile(tile)).rejects.toBeInstanceOf(PortfolioWriteError);
    await expect(writer.saveTile(tile)).rejects.toMatchObject({
      reason: 'commit-failed',
      cause,
    });
  });
});
