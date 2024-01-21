export interface IPublication {
    title: string,
    subTitle: string,
    imageUrl: string,
    shortDesc: string,
    btnMoreDisable: boolean,    
    btnDownloadDisable: boolean,
    downloadUrl?: string,
    downloadFileName: string
}

export interface IPublicationDetails {
    title: string,
    authors: string,
    abstarct: string,
    citation: string
}