# Complete Testing Guide for Phase 4

## Overview

Phase 4 implements comprehensive testing across backend and frontend:
- Backend unit tests for authentication, labs, and nodes
- Backend integration tests for complete workflows
- Frontend unit tests for hooks and components
- Frontend E2E tests for user workflows

## Testing Stack

### Backend Testing
- **Framework**: pytest
- **Test Client**: FastAPI TestClient
- **Database**: SQLite (in-memory for testing)
- **Mocking**: unittest.mock

### Frontend Testing
- **Unit/Integration**: Jest + React Testing Library
- **E2E**: Cypress
- **Mocking**: Jest mocks

## Backend Tests

### 1. Unit Tests Structure

```
backend/tests/
├── conftest.py              # Test configuration and fixtures
├── test_auth.py             # Authentication endpoint tests
├── test_labs.py             # Labs endpoint tests
├── test_nodes.py            # Nodes endpoint tests
└── test_integration.py      # Integration test setup
```

### 2. Running Backend Tests

```bash
# Install dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run specific test file
pytest backend/tests/test_auth.py

# Run specific test class
pytest backend/tests/test_auth.py::TestAuth

# Run specific test
pytest backend/tests/test_auth.py::TestAuth::test_login_success

# Run with coverage
pytest --cov=app --cov-report=html

# Run with verbose output
pytest -v

# Run with markers
pytest -m "not slow"
```

### 3. Test Coverage

#### Authentication Tests
- User registration (success, duplicate username)
- Login (success, invalid credentials, non-existent user)
- Get current user (authenticated, unauthenticated)
- Logout
- Token refresh

#### Labs Tests
- Create lab (success, unauthorized)
- Get all labs
- Get specific lab (success, not found)
- Update lab
- Delete lab
- Start lab
- Stop lab

#### Nodes Tests
- Create node in lab
- Get all nodes in lab
- Get specific node
- Update node
- Delete node
- Start node
- Stop node

## Frontend Tests

### 1. Unit Tests Structure

```
frontend/src/__tests__/
├── setup.js                 # Test setup and mock utilities
├── auth.test.js            # Authentication tests
├── labs.test.js            # Labs hook tests
└── components/
    ├── LoginPage.test.js   # Login component tests
    └── ...

frontend/cypress/
└── e2e/
    ├── auth.cy.js          # Authentication E2E tests
    └── labs.cy.js          # Labs E2E tests
```

### 2. Running Frontend Tests

```bash
# Install dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom cypress

# Run unit tests
npm test

# Run unit tests with coverage
npm test -- --coverage

# Run E2E tests (GUI)
npx cypress open

# Run E2E tests (headless)
npx cypress run

# Run specific E2E test file
npx cypress run --spec "cypress/e2e/auth.cy.js"

# Run tests in watch mode
npm test -- --watch
```

### 3. Test Coverage

#### Authentication Tests
- useAuth hook initialization
- Login with valid/invalid credentials
- Logout
- Token storage in localStorage
- Error handling
- LoginPage component rendering
- Form submission
- Error message display

#### Labs Tests
- useLabs hook initialization
- Fetch labs
- Create lab
- Update lab
- Delete lab
- Start/stop lab
- Error handling
- Loading states

#### E2E Tests
- Authentication flow (login, logout)
- Labs management (view, start, stop, delete)
- Protected routes
- Error handling
- Form validation

## Configuration Files

### pytest.ini
```ini
[pytest]
testpaths = backend/tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
```

### jest.config.js
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
};
```

### cypress.config.js
```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

## Best Practices

✅ **Test Organization**
- Group related tests in describe blocks
- Use clear, descriptive test names
- One assertion per test (when possible)
- DRY: Use fixtures and helper functions

✅ **Mocking**
- Mock external API calls
- Mock async operations
- Reset mocks between tests
- Use realistic mock data

✅ **Async Testing**
- Use `waitFor` for async operations
- Use `act` for state updates
- Handle promises properly
- Set timeouts appropriately

✅ **Coverage**
- Aim for >80% code coverage
- Test happy paths and error cases
- Test edge cases
- Test user interactions

✅ **Performance**
- Use efficient selectors
- Clean up after tests
- Use beforeEach/afterEach appropriately
- Run tests in parallel (where safe)

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt pytest pytest-cov
      - run: pytest backend/tests --cov

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: npm test -- --coverage
      - run: npx cypress run
```

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in pytest.ini or cypress.config.js
2. **Mock not working**: Ensure mock is set up before import
3. **State not updating**: Use `act()` for state updates
4. **Async issues**: Use `waitFor()` instead of sleep
5. **CORS errors in E2E**: Ensure backend is running and accessible

## Next Steps

1. Run tests locally: `pytest` and `npm test`
2. Set up CI/CD pipeline
3. Achieve >80% code coverage
4. Add more E2E tests for complex flows
5. Monitor test performance and optimize

