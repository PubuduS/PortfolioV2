import {
  Injectable,
  Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  doc,
  docData,
  Firestore,
} from '@angular/fire/firestore';
import {
  firstValueFrom,
  map,
  Observable,
  shareReplay,
} from 'rxjs';

import { GetDataService } from '@portfolio-v2/data-access/get-data';
import {
  type CatalogView,
  DOCUMENT_KIND_SPECS,
  type DocumentKind,
  catalogDocPath,
  parseCatalog,
} from '@portfolio-v2/state/dataModels';

/**
 * Root listener for both catalog documents.
 * It never writes.
 */
@Injectable({
  providedIn: 'root',
})
export class DocumentCatalogReader {
  /** One shared snapshot stream per kind. */
  private readonly sources = new Map<DocumentKind, Observable<CatalogView>>();

  /** Signals created once, while this service is being constructed. */
  private readonly views: Record<DocumentKind, Signal<CatalogView>>;

  /**
   * Share one Firestore listener per catalog kind.
   * @param firestore Firestore
   * @param getData storage reads for the cover-letter template
   */
  constructor(
    private firestore: Firestore,
    private getData: GetDataService,
  ) {
    this.views = {
      resume: this.listen('resume'),
      'cover-letter': this.listen('cover-letter'),
    };
  }

  /**
   * Bytes for the generator. Waits until the cover-letter view leaves loading.
   * A ready current version is read with getFileBytes.
   * An empty or unreadable catalog uses the bundled docx.
   * @returns template bytes
   */
  public async coverLetterTemplate(): Promise<ArrayBuffer> {
    const current = await firstValueFrom(this.source('cover-letter'));
    const stored = current.status === 'ready' ? current.catalog.versions[0] : undefined;
    if (stored !== undefined) {
      return this.getData.getFileBytes(stored.storagePath);
    }
    const response = await fetch(DOCUMENT_KIND_SPECS['cover-letter'].bundledUrl);
    if (!response.ok) {
      throw new Error('The template could not be read.');
    }
    return response.arrayBuffer();
  }

  /**
   * Return the shared signal for one kind.
   * @param kind resume or cover letter
   * @returns the shared signal for that kind. The first snapshot ends the loading status.
   */
  public view(kind: DocumentKind): Signal<CatalogView> {
    return this.views[kind];
  }

  /**
   * Turn the snapshot stream for one kind into a signal.
   * @param kind resume or cover letter
   * @returns a signal that starts as loading
   */
  private listen(kind: DocumentKind): Signal<CatalogView> {
    return toSignal(this.source(kind), {
      initialValue: { status: 'loading' },
    });
  }

  /**
   * Return the shared snapshot stream for one kind, creating it on first use.
   * @param kind resume or cover letter
   * @returns one replayed snapshot stream
   */
  private source(kind: DocumentKind): Observable<CatalogView> {
    const existing = this.sources.get(kind);
    if (existing) {
      return existing;
    }
    const source = docData(doc(this.firestore, catalogDocPath(kind))).pipe(
      map((raw) => {
        const parsed = parseCatalog(kind, raw);
        if (!parsed.ok) {
          return { status: 'unreadable' } as const;
        }
        return { status: 'ready' as const, catalog: parsed.catalog };
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.sources.set(kind, source);
    return source;
  }
}
