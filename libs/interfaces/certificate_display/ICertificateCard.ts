export interface ICertificateCard
{
    title: string;
    completedDate: Date | string;
    organization: string;
    credentialID: string;
    certification: 'Here' | 'In Progress'
    certificateURL?: string;
    description: string;
}