/** Shortest accepted name. Shared by the contact form and the mail function. */
export const CONTACT_NAME_MIN = 2;

/** Longest accepted name. Shared by the contact form and the mail function. */
export const CONTACT_NAME_MAX = 50;

/** Shortest accepted message. Shared by the contact form and the mail function. */
export const CONTACT_MESSAGE_MIN = 10;

/** Longest accepted message. Shared by the contact form and the mail function. */
export const CONTACT_MESSAGE_MAX = 1000;

/** Longest accepted email address. */
export const CONTACT_EMAIL_MAX = 254;

/** Messages with more links than this are rejected. */
export const CONTACT_MAX_LINKS = 5;

/** Letters with a single space between words, same rule as the contact form. */
export const CONTACT_NAME_PATTERN = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;
