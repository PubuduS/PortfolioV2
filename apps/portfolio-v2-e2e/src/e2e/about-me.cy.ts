describe('about-me page', () => {
  beforeEach(() => cy.visit('/aboutme'));

  it('should display nav bar in about me page', () => {
    cy.navbar();
  })
  
  it('should display my photo', () => {
    cy.get('[data-aboutme-img="my-photo"]').should('be.visible')
  })

  it('should display a title', () => {
    cy.get('h2').should('have.text', 'ABOUT ME')
  })

  it('should display first introductory paragraph', () => {    
    cy.fixture('about-me/intro-paras.json').then((intro) => {
        cy.get('p').eq(0).should('have.text', intro.paragraph0)
    })    
  })

  it('should display second introductory paragraph', () => {
    cy.fixture('about-me/intro-paras.json').then((intro) => {
        cy.get('p').eq(1).should('have.text', intro.paragraph1)
    })    
  })

  it('should display third introductory paragraph', () => {
    cy.fixture('about-me/intro-paras.json').then((intro) => {
        cy.get('p').eq(2).should('have.text', intro.paragraph2)
    })    
  })

  it('should display interest title', () => {
    cy.get('h3').should('have.text', 'My Personal Interests')
  })

  it('should display third introductory paragraph', () => {
    cy.fixture('about-me/interests.json').then((interests) => {
        cy.get('p').eq(3).should('have.text', interests.intro)
    })  
  })

  // li 1 - 8 are for menu bar.
  it('should display interest 1', () => {
    cy.fixture('about-me/interests.json').then((interests) => {
        cy.get('li').eq(9).should('have.text', interests.interest1)
    })  
  })

  it('should display interest 2', () => {   
    cy.fixture('about-me/interests.json').then((interests) => {
        cy.get('li').eq(10).should('have.text', interests.interest2)
    })  
  })

  it('should display interest 3', () => {    
    cy.fixture('about-me/interests.json').then((interests) => {
        cy.get('li').eq(11).should('have.text', interests.interest3)
    })  
  })

  it('should display interest 4', () => {    
    cy.fixture('about-me/interests.json').then((interests) => {
        cy.get('li').eq(12).should('have.text', interests.interest4)
    })  
  })

  it('should display interest 5', () => {    
    cy.fixture('about-me/interests.json').then((interests) => {
        cy.get('li').eq(13).should('have.text', interests.interest5)
    })  
  })

});