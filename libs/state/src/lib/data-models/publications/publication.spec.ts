import {
  IPublication,
  IPublicationDetails,
} from './IPublication';
import {
  abstractAsText,
  joinPublications,
  nextPublicationId,
  planDelete,
  Publication,
  toPublicationDocs,
  toPublicationDraft,
  PublicationFormValues,
} from './publication';

const cards: IPublication[] = [
  {
    id: 1,
    title: 'ARWalker',
    subTitle: 'Gait Rehabilitation, Mixed Reality, HoloLens 2',
    imageUrl: 'assets/images/publications/Researcher.jpeg',
    shortDesc: 'The paper investigates the use of Augmented Reality (AR) in biomechanics through ARWalker, an application enabling participants, especially older adults and those with diseases, to synchronize their gait with virtual companions, ultimately reducing the risk of falls.',
    btnMoreDisable: false,
    btnDownloadDisable: false,
    downloadUrl: 'assets/PDFs/Publications/ARWalker.pdf',
    downloadFileName: 'ARWalker',
  },
  {
    id: 2,
    title: 'A Study of the Hololens Application Store',
    subTitle: 'System Analysis, Mixed Reality, HoloLens 2',
    imageUrl: 'assets/images/publications/HLStoreImg.jpeg',
    shortDesc: 'This paper investigates the landscape of Augmented Reality (AR) applications based on Head-Mounted Displays (HMDs), particularly focusing on those available on the Microsoft Hololens application store, examining their characteristics and system performance to provide valuable insights to the research community.',
    btnMoreDisable: false,
    btnDownloadDisable: false,
    downloadUrl: 'assets/PDFs/Publications/HLStore.pdf',
    downloadFileName: 'HLStore',
  },
  {
    id: 3,
    title: 'Gait Rehabillitation with Mixed Reality',
    subTitle: 'Gait Rehabilitation, Mixed Reality, HoloLens 2',
    imageUrl: 'assets/images/publications/Thesis.jpg',
    shortDesc: 'This study introduces two portable mixed reality systems for gait training in individuals with gait disabilities, employing an avatar-based approach backed by the proteus effect and complexity matching theories, as well as a system using rhythmic visual cues through a moving bar, with promising pilot study results and ongoing large-scale human trials to evaluate their effectiveness in restoring gait patterns.',
    btnMoreDisable: false,
    btnDownloadDisable: false,
    downloadUrl: 'assets/PDFs/Publications/Thesis.pdf',
    downloadFileName: 'Thesis',
  },
];

const details: IPublicationDetails[] = [
  {
    id: 1,
    title: 'ARWalker: A Virtual Walking Companion Application',
    authors: 'Pubudu Wijesooriya, Aaron Likens, Nick Stergiou, and Spyridon Mastorakis',
    abstarct: [
      'Extended Reality (XR) technologies, including Augmented Reality (AR), have attracted significant attention over the past few years and have been utilized in several fields, including education, healthcare, and manufacturing. In this paper, we aim to explore the use of AR in the field of biomechanics and human movement through the development of ARWalker, which is an AR application that features virtual walking companions (avatars). Research participants walk in close synchrony with the virtual companions, whose gait exhibits properties found in the gait of young and healthy adults. As a result, research participants can train their gait to the gait of the avatar, thus regaining the healthy properties of their gait and reducing the risk of falls. ARWalker can especially help older adults and individuals with diseases, who exhibit pathological gait thus being more prone to falls. We implement a prototype of ARWalker and evaluate its systems performance while running on a Microsoft Hololens 2 headset.',
    ],
    citation: 'Pubudu Wijesooriya, Likens, A. D., Stergiou, N., & Spyridon Mastorakis. (2023). ARWalker: A Virtual Walking Companion Application. ArXiv (Cornell University). https://doi.org/10.48550/arxiv.2311.07502',
  },
  {
    id: 2,
    title: 'Investigating the Characteristics and Performance of Augmented Reality Applications on Head-Mounted Displays: A Study of the Hololens Application Store',
    authors: 'Pubudu Wijesooriya, Sheikh Muhammad Farjad, Nick Stergiou, and Spyridon Mastorakis',
    abstarct: [
      'Augmented Reality (AR) based on Head-Mounted Displays (HMDs) has gained significant traction over the recent years. Nevertheless, it remains unclear what AR HMD-based applications have been developed over the years and what their system performance is when they are run on HMDs. In this paper, we aim to shed light into this direction. Our study focuses on the applications available on the Microsoft Hololens application store given the wide use of the Hololens headset. Our study has two major parts: (i) we collect metadata about the applications available on the Microsoft Hololens application store to understand their characteristics (e.g., categories, pricing, permissions requested, hardware and software compatibility); and (ii) we interact with these applications while running on a Hololens 2 headset and collect data about systems-related metrics (e.g., memory and storage usage, time spent on CPU and GPU related operations) to investigate the systems performance of applications. Our study has resulted in several interesting findings, which we share with the research community.',
    ],
    citation: 'Pubudu Wijesooriya, Sheikh Muhammad Farjad, Stergiou, N., & Spyridon Mastorakis. (2023). Investigating the Characteristics and Performance of Augmented Reality Applications on Head-Mounted Displays: A Study of the Hololens Application  Store. ArXiv (Cornell University). https://doi.org/10.48550/arxiv.2303.07523',
  },
  {
    id: 3,
    title: 'Use of Mixed Reality to Provide Gait Rehabilitation',
    authors: 'Pubudu Wijesooriya, Advisor: Dr. Spyridon Mastorakis',
    abstarct: [
      'Gait disorders are a common issue affecting millions of people worldwide regardless of age. In addition to reducing mobility, gait disorders increase the risk of falling, and can adversely affect the quality of life. Therefore, gait training is an essential aspect of well-being, especially for the elderly population. To address this problem, many systems have been developed. In this study, we present a novel method to provide gait training. We present two portable mixed reality systems designed to aid gait training for individuals with gait disabilities.',
      'The first system uses an avatar to provide visual cues to the patient. It relies on the proteus effect and complexity matching to restore the natural gait. The proteus effect refers to the phenomenon where individuals adopt the characteristics of their virtual avatars. Complexity matching is the tendency to synchronize movements by matching others\' complexity. Both theories are backed by credible scientific evidence. Our pilot study showed that this approach is effective in restoring gait patterns. The system is currently undergoing large-scale human trials to evaluate its feasibility further.',
      'A second system provides rhythmic visual cues through a moving bar, and the user must match their foot placement accordingly. As the rhythm changes, users are required to strike with their left heel when the bar reaches the top level and with their right heel when it hits the bottom level. Pilot studies supported by similar research have also shown promising results, and we are currently conducting large-scale human trials to evaluate the system\'s effectiveness further.',
      'Both systems are designed to help patients with gait disabilities and provide implicit learning. We aim to provide them with cost-effective, self-training methods to restore their gait. The results of this study could have significant implications for the rehabilitation of individuals with gait disabilities.',
    ],
    citation: 'Wijesooriya, P. (2023, May 3). Use of Mixed Reality to Provide Gait Rehabilitation.',
  },
];

/**
 * @param id record id
 * @returns the joined publication for that id
 */
function publication(id: number): Publication {
  const match = joinPublications(cards, details).find((item) => item.id === id);
  if (!match) {
    throw new Error(`missing publication ${id}`);
  }
  return match;
}

/**
 * @param values form payload
 * @returns the failure reason
 */
function draftFailure(values: PublicationFormValues): string {
  const result = toPublicationDraft(values);
  if (result.ok) {
    throw new Error('expected the draft to be rejected');
  }
  return result.reason;
}

/**
 * @param overrides fields that differ from a valid new-record payload
 * @returns form values
 */
function formValues(overrides: Partial<PublicationFormValues> = {}): PublicationFormValues {
  return {
    id: 4,
    mode: 'new',
    title: '  Card title  ',
    detailTitle: '  Full title  ',
    keywords: ' keywords ',
    summary: ' summary ',
    authors: ' authors ',
    abstractText: ' First paragraph. \n\n Second paragraph. ',
    citation: ' citation ',
    cover: new File(['img'], 'cover.png', { type: 'image/png' }),
    paper: null,
    fileName: '',
    ...overrides,
  };
}

describe('publication codec', () => {
  describe('round trip of the stored records', () => {
    it('reproduces each card and details document', () => {
      const joined = joinPublications(cards, details);

      expect(joined.map((item) => item.id)).toEqual([1, 2, 3]);
      joined.forEach((item) => {
        const docs = toPublicationDocs(item);
        expect(docs.card).toEqual(cards.find((card) => card.id === item.id));
        expect(docs.details).toEqual(details.find((detail) => detail.id === item.id));
      });
    });

    it('keeps bundled asset urls and the abstract paragraphs', () => {
      const thesis = publication(3);

      expect(thesis.cover).toEqual({
        source: 'bundled',
        url: 'assets/images/publications/Thesis.jpg',
      });
      expect(thesis.paper).toEqual({
        asset: { source: 'bundled', url: 'assets/PDFs/Publications/Thesis.pdf' },
        fileName: 'Thesis',
      });
      expect(thesis.abstract).toHaveLength(4);
      expect(thesis.title).toBe('Gait Rehabillitation with Mixed Reality');
      expect(thesis.detailTitle).toBe('Use of Mixed Reality to Provide Gait Rehabilitation');
    });
  });

  describe('records that do not pair', () => {
    it('fills empty details when the details document is missing', () => {
      const [item] = joinPublications([cards[0]], []);
      const docs = toPublicationDocs(item);

      expect(item.authors).toBe('');
      expect(item.abstract).toEqual([]);
      expect(item.citation).toBe('');
      expect(item.detailTitle).toBe(cards[0].title);
      expect(docs.details).toEqual({
        id: 1,
        title: 'ARWalker',
        authors: '',
        abstarct: [],
        citation: '',
      });
    });

    it('drops details documents that have no card', () => {
      const orphan: IPublicationDetails = { ...details[1], id: 9 };

      const joined = joinPublications([cards[0]], [details[0], orphan]);

      expect(joined.map((item) => item.id)).toEqual([1]);
    });
  });

  describe('nextPublicationId', () => {
    it('is one higher than the max id across both collections', () => {
      expect(nextPublicationId(cards, details)).toBe(4);
      expect(nextPublicationId([{ id: 1 }, { id: 3 }], [{ id: 9 }])).toBe(10);
    });

    it('is 1 when both collections are empty', () => {
      expect(nextPublicationId(undefined, undefined)).toBe(1);
      expect(nextPublicationId([], [])).toBe(1);
    });
  });

  describe('planDelete', () => {
    it('lists both documents and no bundled assets', () => {
      const plan = planDelete(publication(1));

      expect(plan).toEqual({
        docs: [
          'publication-section/publication-01',
          'publication-details-section/publication-01',
        ],
        files: [],
      });
      expect(plan.files.join(' ')).not.toContain('assets/');
    });

    it('lists storage paths for storage assets only', () => {
      const stored = publication(2);
      const plan = planDelete({
        ...stored,
        cover: { source: 'storage', url: 'https://firebasestorage.googleapis.com/cover' },
      });

      expect(plan.files).toEqual(['education/publications/publication-02/cover']);
      expect(plan.docs).toEqual([
        'publication-section/publication-02',
        'publication-details-section/publication-02',
      ]);
    });
  });

  describe('derived card flags', () => {
    it('sets btnDownloadDisable from whether a paper exists', () => {
      const withPaper = toPublicationDocs({
        ...publication(1),
        paper: null,
      });
      const storedFlagIgnored = toPublicationDocs(joinPublications([{
        ...cards[1],
        btnDownloadDisable: true,
      }], [details[1]])[0]);

      expect(withPaper.card.btnDownloadDisable).toBe(true);
      expect(withPaper.card.downloadUrl).toBeUndefined();
      expect(withPaper.card.downloadFileName).toBe('');
      expect(storedFlagIgnored.card.btnDownloadDisable).toBe(false);
      expect(storedFlagIgnored.card.downloadUrl).toBe(cards[1].downloadUrl);
    });

    it('always writes btnMoreDisable as false', () => {
      const docs = toPublicationDocs(joinPublications([{
        ...cards[0],
        btnMoreDisable: true,
      }], [details[0]])[0]);

      expect(docs.card.btnMoreDisable).toBe(false);
    });
  });

  describe('toPublicationDraft', () => {
    it('splits the abstract on blank lines and trims the text fields', () => {
      const result = toPublicationDraft(formValues());

      expect(result).toEqual({
        ok: true,
        draft: expect.objectContaining({
          id: 4,
          title: 'Card title',
          detailTitle: 'Full title',
          keywords: 'keywords',
          summary: 'summary',
          authors: 'authors',
          citation: 'citation',
          abstract: ['First paragraph.', 'Second paragraph.'],
          paper: null,
        }),
      });
    });

    it('round-trips paragraphs through the text area', () => {
      const text = abstractAsText(details[2].abstarct);
      const result = toPublicationDraft(formValues({
        abstractText: text,
        mode: 'edit',
        cover: { source: 'bundled', url: 'assets/images/publications/Thesis.jpg' },
      }));

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.draft.abstract).toEqual(details[2].abstarct);
      }
    });

    it('requires a cover for a new record and an image when the cover is a file', () => {
      expect(draftFailure(formValues({ cover: null }))).toBe('missing-cover');
      expect(draftFailure(formValues({
        cover: new File(['x'], 'notes.pdf', { type: 'application/pdf' }),
      }))).toBe('unsupported-cover');
    });

    it('accepts an existing asset as the cover on edit', () => {
      const result = toPublicationDraft(formValues({
        mode: 'edit',
        cover: { source: 'bundled', url: 'assets/images/publications/Researcher.jpeg' },
      }));

      expect(result.ok).toBe(true);
    });

    it('requires a pdf file name when a paper is set', () => {
      const pdf = new File(['%PDF'], 'paper.pdf', { type: 'application/pdf' });

      expect(draftFailure(formValues({ paper: pdf, fileName: '   ' }))).toBe('missing-file-name');
      expect(draftFailure(formValues({
        paper: new File(['x'], 'paper.png', { type: 'image/png' }),
        fileName: 'Paper',
      }))).toBe('unsupported-paper');

      const result = toPublicationDraft(formValues({ paper: pdf, fileName: ' ARWalker ' }));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.draft.paper).toEqual({ asset: pdf, fileName: 'ARWalker' });
      }
    });

    it('rejects an empty abstract and an id below 1', () => {
      expect(draftFailure(formValues({ abstractText: '  \n\n  ' }))).toBe('empty-abstract');
      expect(draftFailure(formValues({ id: 0 }))).toBe('invalid-id');
    });
  });
});
