describe('check that site has index file', () => {
  it('should have an index file', () => {
    cy.readFile('../../index.html')
      .should('exist')
      .should('contain', '<!DOCTYPE html>');
  });
});

describe('check that index contains head and body', () => {
  it('should have a head', () => {
    cy.visit('index.html');
    cy.get('head')
      .should('exist');
  });

  it('should have a body', () => {
    cy.visit('index.html');
    cy.get('body')
      .should('exist');
  });
});

describe('check for quiz structure elements', () => {
  it('should have a button for revealing results', () => {
    cy.visit('index.html');
    cy.get('button')
      .should('exist');
  });

  it('should have radio buttons for answers', () => {
    cy.visit('index.html');
    cy.get('input[type="radio"]')
      .should('exist');
  });

  it('should have labels for radio buttons', () => {
    cy.visit('index.html');
    cy.get('label')
      .should('exist');
  });
});

describe('check for radio button grouping', () => {
  it('should have radio buttons grouped by name attribute', () => {
    cy.visit('index.html');
    cy.get('input[type="radio"]')
      .should('have.attr', 'name');
  });

  it('should have radio buttons with values', () => {
    cy.visit('index.html');
    cy.get('input[type="radio"]')
      .should('have.attr', 'value');
  });
});

describe('check for result display', () => {
  it('should have a container for displaying results', () => {
    cy.visit('index.html');
    cy.get('#resultContainer, .result, .modal')
      .should('exist');
  });
});

describe('check for error handling', () => {
  it('should have an error container for validation messages', () => {
    cy.visit('index.html');
    cy.get('#errorContainer, .error, .error-message')
      .should('exist');
  });
});

describe('test quiz functionality', () => {
  it('should allow selecting radio buttons', () => {
    cy.visit('index.html');
    cy.get('input[type="radio"]').first()
      .check({ force: true })
      .should('be.checked');
  });

  it('should uncheck other radio buttons in the same group when one is selected', () => {
    cy.visit('index.html');
    cy.get('input[type="radio"]').then(($radios) => {
      if ($radios.length >= 2) {
        const firstName = $radios.first().attr('name');
        const sameGroupRadios = $radios.filter(`[name="${firstName}"]`);

        if (sameGroupRadios.length >= 2) {
          cy.wrap(sameGroupRadios[0]).check({ force: true }).should('be.checked');
          cy.wrap(sameGroupRadios[1]).check({ force: true }).should('be.checked');
          cy.wrap(sameGroupRadios[0]).should('not.be.checked');
        }
      }
    });
  });

  it('should show error when trying to submit without answering all questions', () => {
    cy.visit('index.html');
    cy.get('button').click();
    cy.get('#errorContainer, .error, .error-message')
      .should('be.visible');
  });
});

describe('check for linked stylesheets and scripts', () => {
  it('should have a linked CSS file', () => {
    cy.visit('index.html');
    cy.get('head link[rel="stylesheet"]')
      .should('exist');
  });

  it('should have a linked JavaScript file', () => {
    cy.readFile('../../index.html')
      .should('contain', '<script')
      .should('contain', '.js');
  });
});
