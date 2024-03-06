const param1 = 'My name is Pubudu. Currently, I live in Omaha, Nebraska. I enjoy building software, games, and websites. My interest in software engineering started back in 2012 when I decided to attend a code camp. After that, I decided to pursue my higher education in the US.';

const param2 = 'Fast forward to today, I\'ve had the privilege of working at A corporation, a charitable organization, and a small business. I graduated from the University of Omaha at Nebraska with a MSc in Computer Science in May 2023. These days I am actively looking forward jobs that align with my skills.';

const param3 = 'I am currently open to new opportunities where I can learn new technologies and helped to develop robust software. Need something built or simply want to have chat? Reach out to me on social media or send me an email.';

const param4 = 'When I\'m not coding my next project, I enjoy spending my time doing any on the following:';

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
    cy.get('p').eq(0).should('have.text', param1)
  })

  it('should display second introductory paragraph', () => {
    cy.get('p').eq(1).should('have.text', param2)
  })

  it('should display third introductory paragraph', () => {
    cy.get('p').eq(2).should('have.text', param3)
  })

  it('should display interest title', () => {
    cy.get('h3').should('have.text', 'My Personal Interests')
  })

  it('should display third introductory paragraph', () => {
    cy.get('p').eq(3).should('have.text', param4)
  })

  // li 1 - 8 are for menu bar.
  it('should display interest 1', () => {
    cy.get('li').eq(9).should('have.text', 'I love Cooking. I love to create Asian American fusion dishes.')
  })

  it('should display interest 2', () => {
    cy.get('li').eq(10).should('have.text', 'I\'m a bookworm and fan of Philosophy, Science Fiction, Fictional, and Mystery genre.')
  })

  it('should display interest 3', () => {
    cy.get('li').eq(11).should('have.text', 'I\'m an avid fan of video games. Currently, I\'m playing Apex Legends. If you\'re interested you can see my gameplays here.')
  })

  it('should display interest 4', () => {
    cy.get('li').eq(12).should('have.text', 'I\'m eager to learn new technologies and new skills.')
  })

  it('should display interest 5', () => {
    cy.get('li').eq(13).should('have.text', 'I enjoy playing Chess.')
  })

});