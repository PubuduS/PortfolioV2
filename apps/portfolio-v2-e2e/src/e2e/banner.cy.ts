describe('banner page', () => {
  beforeEach(() => cy.visit('/home'));

  it('should display nav bar in home page', () => {
    cy.navbar();
  });

  it('should display seasonal image', () => {
    cy.get('[ data-banner-img="sesonal-img"]').should('be.visible');
  });
});
