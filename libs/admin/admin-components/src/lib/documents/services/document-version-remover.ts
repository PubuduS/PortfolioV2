import { Injectable } from '@angular/core';

import { type DeleteDocumentRequest } from '@portfolio-v2/state/dataModels';
import { DocumentWriter } from './document-writer.service';

/**
 * Adapts the document writer to the shared delete dialog.
 * The dialog calls remove with the request the page opened it with.
 */
@Injectable()
export class DocumentVersionRemover {
  /**
   * Build the adapter around the route writer.
   * @param writer document writer
   */
  constructor(private readonly writer: DocumentWriter) {}

  /**
   * Remove the version in the request.
   * @param request kind and row the dialog still holds
   * @returns the writer result
   */
  public remove(request: DeleteDocumentRequest): Promise<void> {
    return this.writer.remove(request.kind, request.version);
  }
}
