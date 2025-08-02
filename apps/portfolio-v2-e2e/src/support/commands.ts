/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    login(email: string, password: string): void;
    navbar(): void;
  }
}

Cypress.Commands.add('navbar', () => {
  cy.contains('Home');
  cy.contains('About Me');
  cy.contains('Skills');
  cy.contains('Experience');
  cy.contains('Portfolio');
  cy.contains('Education');
  cy.contains('Resume');
  cy.contains('Cover Letter');
  cy.get('[data-contact-btn="Contact"]');
});
