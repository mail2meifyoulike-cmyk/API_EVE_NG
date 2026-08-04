# Frontend E2E Tests with Cypress

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should display login page', () => {
    cy.contains('EVE Lab Automation').should('be.visible');
    cy.get('input[placeholder="Enter username"]').should('be.visible');
    cy.get('input[placeholder="Enter password"]').should('be.visible');
  });

  it('should login successfully', () => {
    cy.get('input[placeholder="Enter username"]').type('admin');
    cy.get('input[placeholder="Enter password"]').type('password');
    cy.get('button:contains("Login")').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should show error on invalid credentials', () => {
    cy.get('input[placeholder="Enter username"]').type('invalid');
    cy.get('input[placeholder="Enter password"]').type('invalid');
    cy.get('button:contains("Login")').click();

    cy.contains(/invalid credentials|login failed/i).should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first
    cy.get('input[placeholder="Enter username"]').type('admin');
    cy.get('input[placeholder="Enter password"]').type('password');
    cy.get('button:contains("Login")').click();

    cy.url().should('include', '/dashboard');

    // Logout
    cy.get('button:contains("Logout")').click();
    cy.url().should('include', '/login');
  });
});

describe('Labs Management', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    // Login
    cy.get('input[placeholder="Enter username"]').type('admin');
    cy.get('input[placeholder="Enter password"]').type('password');
    cy.get('button:contains("Login")').click();
    cy.url().should('include', '/dashboard');
  });

  it('should navigate to labs page', () => {
    cy.get('button:contains("View All Labs")').click();
    cy.url().should('include', '/labs');
    cy.contains('Labs').should('be.visible');
  });

  it('should display list of labs', () => {
    cy.get('button:contains("View All Labs")').click();
    cy.get('.lab-card').should('exist');
  });

  it('should start a lab', () => {
    cy.get('button:contains("View All Labs")').click();
    cy.get('.lab-card').first().within(() => {
      cy.get('button:contains("Start")').click();
    });

    cy.get('.status-badge').first().should('contain', 'running');
  });

  it('should stop a lab', () => {
    cy.get('button:contains("View All Labs")').click();
    cy.get('.lab-card').first().within(() => {
      cy.get('button:contains("Stop")').click();
    });

    cy.get('.status-badge').first().should('contain', 'stopped');
  });

  it('should delete a lab', () => {
    cy.get('button:contains("View All Labs")').click();
    const initialCount = cy.get('.lab-card').length;

    cy.get('.lab-card').first().within(() => {
      cy.get('button:contains("Delete")').click();
    });

    cy.on('window:confirm', () => true);
    cy.get('.lab-card').should('have.length.lessThan', initialCount);
  });
});

describe('Protected Routes', () => {
  it('should redirect to login if not authenticated', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.url().should('include', '/login');
  });

  it('should allow access to dashboard when authenticated', () => {
    cy.visit('http://localhost:3000');
    cy.get('input[placeholder="Enter username"]').type('admin');
    cy.get('input[placeholder="Enter password"]').type('password');
    cy.get('button:contains("Login")').click();

    cy.url().should('include', '/dashboard');
    cy.visit('http://localhost:3000/labs');
    cy.url().should('include', '/labs');
  });
});
