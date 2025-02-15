describe('skills page', () => {
  beforeEach(() => cy.visit('/skills'));

  it('should display nav bar in about me page', () => {
    cy.navbar();
  });

  it('should display a title', () => {
    cy.get('h2').should('have.text', 'TECHNICAL SKILLS');
  });

  it('should display first introductory paragraph', () => {
    cy.get('p').eq(0).should('have.text', 'I\'ve worked with a wide variety of programming languages. Here are a few technologies I have been working on recently');
  });

  it('should display zeroth language', () => {
    cy.get('h6').eq(0).should('have.text', 'C++');
  });

  it('should display first language', () => {
    cy.get('h6').eq(1).should('have.text', 'JAVA');
  });

  it('should display second language', () => {
    cy.get('h6').eq(2).should('have.text', 'CSS');
  });

  it('should display third language', () => {
    cy.get('h6').eq(3).should('have.text', 'HTML');
  });

  it('should display fourth language', () => {
    cy.get('h6').eq(4).should('have.text', 'AWS');
  });

  it('should display fifth language', () => {
    cy.get('h6').eq(5).should('have.text', 'C#');
  });

  it('should display framework section heading', () => {
    cy.get('h3').eq(0).should('have.text', 'MOST FREQUENTLY USED TOOLS');
  });

  it('should display framework and engine title', () => {
    cy.get('h4').eq(0).should('have.text', 'FRAMEWORKS AND ENGINES');
  });

  it('should display framework1', () => {
    cy.get('li').eq(9).should('have.text', 'Unity Engine');
  });

  it('should display framework2', () => {
    cy.get('li').eq(10).should('have.text', 'MRTK');
  });

  it('should display framework3', () => {
    cy.get('li').eq(11).should('have.text', 'Bootstrap');
  });

  it('should display framework4', () => {
    cy.get('li').eq(12).should('have.text', 'Angular');
  });

  it('should display framework5', () => {
    cy.get('li').eq(13).should('have.text', 'STL');
  });

  it('should display software title', () => {
    cy.get('h4').eq(1).should('have.text', 'SOFTWARE');
  });

  it('should display software1', () => {
    cy.get('li').eq(14).should('have.text', 'Windows(10) & Linux(Ubuntu)');
  });

  it('should display software2', () => {
    cy.get('li').eq(15).should('have.text', 'Git & Subversion');
  });

  it('should display software3', () => {
    cy.get('li').eq(16).should('have.text', 'Doxygen');
  });

  it('should display software4', () => {
    cy.get('li').eq(17).should('have.text', 'SQLite');
  });

  it('should display software5', () => {
    cy.get('li').eq(18).should('have.text', 'Jira');
  });
});
