/** Interface for Certificates */
export interface ICertificateCard {
  /** ID */
  id: number,
  /** Certificate Title */
  title: string;
  /** Completion Date */
  completedDate: string;
  /** Issuing Organization */
  organization: string;
  /** Credential ID. Use None if unavailable */
  credentialID: string;
  /** Certification State */
  certification: 'Here' | 'In Progress'
  /** Certification URL */
  certificateURL?: string;
  /** Description */
  description: string;
}
