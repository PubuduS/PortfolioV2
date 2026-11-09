/** Validation messages for a manager name. */
export interface IManagerValidatorMsgs {
  /** Shown when the name does not match the allowed pattern. */
  mngPatternError: string,
  /** Shown when the name is longer than the maximum. */
  mngNameMaxLen: string
}

/** Validation messages for a company name. */
export interface ICompanyValidatorMsgs {
  /** Shown when the company name is missing. */
  cmpNameReqError: string,
  /** Shown when the company name is longer than the maximum. */
  cmpNameMaxLen: string
}

/** Validation messages for an email address. */
export interface IEmailValidatorMsgs {
  /** Shown when the email is missing. */
  emailReqError: string,
  /** Shown when the email does not match the allowed pattern. */
  emailPttrnError: string
}

/** Validation messages for a password. */
export interface IPasswordValidatorMsgs {
  /** Shown when the password is missing. */
  passwordReqError: string,
  /** Shown when the password does not match the allowed pattern. */
  passwordPttrnError?: string
}

/** Validation messages for a sender name. */
export interface ISenderNameValidatorMsgs {
  /** Shown when the name is missing. */
  senderReqError: string,
  /** Shown when the name is shorter than the minimum. */
  senderMinLenError: string,
  /** Shown when the name is longer than the maximum. */
  senderMaxLenError: string,
  /** Shown when the name does not match the allowed pattern. */
  senderPttrnError: string
}

/** Validation messages for a message body. */
export interface IMessageValidatorMsgs {
  /** Shown when the message is missing. */
  msgReqError: string,
  /** Shown when the message is shorter than the minimum. */
  msgMinLenError: string,
  /** Shown when the message is longer than the maximum. */
  msgMaxLenError: string
}
