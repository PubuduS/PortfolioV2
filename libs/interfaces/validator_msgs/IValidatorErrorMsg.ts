export interface IManagerValidatorMsgs {
    mngPatternError: string,
    mngNameMaxLen: string
}

export interface ICompanyValidatorMsgs {
    cmpNameReqError: string,
    cmpNameMaxLen: string
}

export interface IEmailValidatorMsgs {
    emailReqError: string,
    emailPttrnError: string
}

export interface ISenderNameValidatorMsgs {
    senderReqError: string,
    senderMinLenError: string,
    senderMaxLenError: string,
    senderPttrnError: string
}

export interface IMessageValidatorMsgs {
    msgReqError: string,
    msgMinLenError: string,
    msgMaxLenError: string
}