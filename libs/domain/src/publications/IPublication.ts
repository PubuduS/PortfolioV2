/** Interface for Publications */
export interface IPublication {
  /** ID */
  id: number,
  /** Title */
  title: string,
  /** Subtitle */
  subTitle: string,
  /** Image URL */
  imageUrl: string,
  /** Short Description */
  shortDesc: string,
  /** More Button Disable */
  btnMoreDisable: boolean,
  /** Download Button Disable */
  btnDownloadDisable: boolean,
  /** Download URL */
  downloadUrl?: string,
  /** Download File Name */
  downloadFileName: string
}

/** Interface for Publication Details */
export interface IPublicationDetails {
  /** ID */
  id: number,
  /** Title */
  title: string,
  /** Authors */
  authors: string,
  /** Abstract paragraphs. The stored field name is misspelled. */
  abstarct: readonly string[],
  /** Citation */
  citation: string
}
