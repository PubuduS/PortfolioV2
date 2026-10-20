import {
  IPublication,
  IPublicationDetails,
} from '../data-models';
import {
  nextPublicationRecordIdSelector,
  publicationRecordsSelector,
} from './publication-records.selector';

const card: IPublication = {
  id: 1,
  title: 'ARWalker',
  subTitle: 'keywords',
  imageUrl: 'storage://portfolio/publications/publication-card-images/ID-01-Image.webp',
  shortDesc: 'summary',
  btnMoreDisable: false,
  btnDownloadDisable: false,
  downloadUrl: 'storage://portfolio/publications/papers/ID-01-Paper.pdf',
  downloadFileName: 'ARWalker',
};

const detail: IPublicationDetails = {
  id: 1,
  title: 'ARWalker: A Virtual Walking Companion Application',
  authors: 'Pubudu Wijesooriya',
  abstarct: ['One paragraph.'],
  citation: 'citation',
};

describe('publication record selectors', () => {
  it('joins a card with its details and drops an orphan', () => {
    const orphan: IPublicationDetails = { ...detail, id: 9, title: 'Orphan' };
    const [record] = publicationRecordsSelector.projector([card], [detail, orphan]);

    expect(record.title).toBe('ARWalker');
    expect(record.detailTitle).toBe('ARWalker: A Virtual Walking Companion Application');
    expect(record.abstract).toEqual(['One paragraph.']);
    expect(publicationRecordsSelector.projector([card], [detail, orphan])).toHaveLength(1);
  });

  it('takes the next id from both collections', () => {
    const orphan: IPublicationDetails = { ...detail, id: 9 };

    expect(nextPublicationRecordIdSelector.projector([card], [orphan])).toBe(10);
    expect(nextPublicationRecordIdSelector.projector(undefined, undefined)).toBe(1);
  });
});
