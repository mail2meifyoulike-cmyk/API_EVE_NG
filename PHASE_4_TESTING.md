# Phase 4: Testing - Complete Testing Strategy & Implementation

## Overview

This phase establishes comprehensive testing at all levels:
- **Unit Tests**: Individual functions and hooks
- **Integration Tests**: API endpoints and services
- **Component Tests**: React components
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Load and stress testing

---

## 1. Backend Testing

### Structure
```
backend/tests/
├── __init__.py
├── conftest.py                    # Shared fixtures
├── pytest.ini                     # Pytest configuration
├── unit/
│   ├── test_auth_service.py
│   ├── test_labs_service.py
│   ├── test_nodes_service.py
│   ├── test_cache_service.py
│   └── test_audit_service.py
├── integration/
│   ├── test_auth_endpoints.py
│   ├── test_labs_endpoints.py
│   ├── test_nodes_endpoints.py
│   ├── test_networks_endpoints.py
│   └── test_error_handling.py
└── e2e/
    ├── test_lab_workflow.py
    ├── test_user_workflow.py
    └── test_monitoring_workflow.py
```

### 1.1 conftest.py - Shared Fixtures
```python
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import User, Lab
from app.services.eve.client import EVEngClient


# Database fixtures
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_db():
    """Create test database"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
async def client(test_db):
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as test_client:
        yield test_client


@pytest.fixture
def db_session(test_db):
    """Create test database session"""
    TestingSessionLocal = sessionmaker(
        autocommit=False, 
        autoflush=False, 
        bind=test_db
    )
    db = TestingSessionLocal()
    yield db
    db.rollback()
    db.close()


# Mock fixtures
@pytest.fixture
def mock_eve_client(mocker):
    """Mock EVE-NG client"""
    return mocker.MagicMock(spec=EVEngClient)


@pytest.fixture
def mock_eve_response():
    """Mock EVE-NG response"""
    return {
        "code": 200,
        "status": "success",
        "data": {
            "labs": [
                {
                    "id": 1,
                    "name": "Lab 1",
                    "status": "stopped",
                }
            ]
        }
    }


# Test data fixtures
@pytest.fixture
def test_user(db_session):
    """Create test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def test_lab(db_session, test_user):
    """Create test lab"""
    lab = Lab(
        name="Test Lab",
        description="Test Description",
        owner_id=test_user.id,
        status="stopped",
    )
    db_session.add(lab)
    db_session.commit()
    return lab


@pytest.fixture
def auth_headers(test_user):
    """Create auth headers with JWT token"""
    # Generate test JWT token
    from app.services.auth_service import AuthService
    auth_service = AuthService()
    token = auth_service.create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}
```

### 1.2 Unit Tests Example
```python
# backend/tests/unit/test_auth_service.py
import pytest
from app.services.auth_service import AuthService
from app.utils.exceptions import InvalidCredentialsError


class TestAuthService:
    @pytest.fixture
    def auth_service(self):
        return AuthService()

    @pytest.mark.asyncio
    async def test_create_access_token(self, auth_service):
        """Test JWT token creation"""
        user_id = 1
        token = auth_service.create_access_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Verify token payload
        decoded = auth_service.decode_token(token)
        assert decoded["sub"] == str(user_id)

    @pytest.mark.asyncio
    async def test_decode_token(self, auth_service):
        """Test JWT token decoding"""
        user_id = 1
        token = auth_service.create_access_token(user_id)
        
        decoded = auth_service.decode_token(token)
        assert decoded["sub"] == str(user_id)

    @pytest.mark.asyncio
    async def test_decode_invalid_token(self, auth_service):
        """Test decoding invalid token"""
        with pytest.raises(Exception):
            auth_service.decode_token("invalid_token")

    @pytest.mark.asyncio
    async def test_hash_password(self, auth_service):
        """Test password hashing"""
        password = "test_password_123"
        hashed = auth_service.hash_password(password)
        
        assert hashed != password
        assert auth_service.verify_password(password, hashed)

    @pytest.mark.asyncio
    async def test_verify_wrong_password(self, auth_service):
        """Test password verification with wrong password"""
        password = "test_password_123"
        hashed = auth_service.hash_password(password)
        
        assert not auth_service.verify_password("wrong_password", hashed)
```

### 1.3 Integration Tests Example
```python
# backend/tests/integration/test_auth_endpoints.py
import pytest


class TestAuthEndpoints:
    @pytest.mark.asyncio
    async def test_login_success(self, client, test_user):
        """Test successful login"""
        response = await client.post(
            "/api/auth/login",
            json={
                "username": test_user.username,
                "password": "test_password",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["username"] == test_user.username

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client, test_user):
        """Test login with invalid credentials"""
        response = await client.post(
            "/api/auth/login",
            json={
                "username": test_user.username,
                "password": "wrong_password",
            }
        )
        
        assert response.status_code == 401
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_logout(self, client, auth_headers):
        """Test logout"""
        response = await client.post(
            "/api/auth/logout",
            headers=auth_headers,
        )
        
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_get_auth_status_authenticated(self, client, auth_headers):
        """Test getting auth status when authenticated"""
        response = await client.get(
            "/api/auth/status",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True

    @pytest.mark.asyncio
    async def test_get_auth_status_unauthenticated(self, client):
        """Test getting auth status when not authenticated"""
        response = await client.get("/api/auth/status")
        
        assert response.status_code == 401
```

### 1.4 Labs Endpoint Tests
```python
# backend/tests/integration/test_labs_endpoints.py
import pytest


class TestLabsEndpoints:
    @pytest.mark.asyncio
    async def test_list_labs(self, client, auth_headers, test_lab):
        """Test listing labs"""
        response = await client.get(
            "/api/labs",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) > 0
        assert data["data"][0]["id"] == test_lab.id

    @pytest.mark.asyncio
    async def test_get_lab_details(self, client, auth_headers, test_lab):
        """Test getting lab details"""
        response = await client.get(
            f"/api/labs/{test_lab.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["id"] == test_lab.id
        assert data["data"]["name"] == test_lab.name

    @pytest.mark.asyncio
    async def test_create_lab(self, client, auth_headers):
        """Test creating a lab"""
        lab_data = {
            "name": "New Lab",
            "description": "New Test Lab",
        }
        
        response = await client.post(
            "/api/labs",
            json=lab_data,
            headers=auth_headers,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["name"] == lab_data["name"]

    @pytest.mark.asyncio
    async def test_update_lab(self, client, auth_headers, test_lab):
        """Test updating a lab"""
        update_data = {
            "name": "Updated Lab",
            "description": "Updated Description",
        }
        
        response = await client.put(
            f"/api/labs/{test_lab.id}",
            json=update_data,
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["name"] == update_data["name"]

    @pytest.mark.asyncio
    async def test_delete_lab(self, client, auth_headers, test_lab):
        """Test deleting a lab"""
        response = await client.delete(
            f"/api/labs/{test_lab.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_start_lab(self, client, auth_headers, test_lab, mock_eve_client):
        """Test starting a lab"""
        response = await client.post(
            f"/api/labs/{test_lab.id}/start",
            headers=auth_headers,
        )
        
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_stop_lab(self, client, auth_headers, test_lab):
        """Test stopping a lab"""
        response = await client.post(
            f"/api/labs/{test_lab.id}/stop",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
```

### 1.5 Running Backend Tests
```bash
# Run all tests
pytest backend/tests/

# Run specific test file
pytest backend/tests/unit/test_auth_service.py

# Run with coverage
pytest backend/tests/ --cov=app --cov-report=html

# Run integration tests only
pytest backend/tests/integration/

# Run with verbose output
pytest backend/tests/ -v

# Run and stop on first failure
pytest backend/tests/ -x

# Run specific test
pytest backend/tests/unit/test_auth_service.py::TestAuthService::test_create_access_token
```

---

## 2. Frontend Testing

### Structure
```
frontend/src/__tests__/
├── __mocks__/
│   ├── api.js
│   └── react-router-dom.js
├── hooks/
│   ├── useAuth.test.js
│   ├── useLabs.test.js
│   ├── useQuery.test.js
│   └── useMutation.test.js
├── context/
│   ├── AuthContext.test.js
│   ├── LabsContext.test.js
│   └── NotificationContext.test.js
├── components/
│   ├── LabCard.test.js
│   ├── LabForm.test.js
│   ├── Header.test.js
│   └── Loading.test.js
└── pages/
    ├── Login.test.js
    ├── LabsList.test.js
    └── LabDetails.test.js
```

### 2.1 Setup Files

#### jest.config.js
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

#### src/__tests__/setup.js
```javascript
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

### 2.2 Hook Tests

#### src/__tests__/hooks/useAuth.test.js
```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import * as authAPI from '../../api/auth';

jest.mock('../../api/auth');

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('should check auth status on mount', async () => {
    authAPI.getStatus.mockResolvedValue({
      data: { user: { id: 1, username: 'testuser' } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.username).toBe('testuser');
  });

  test('should handle login successfully', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        token: 'test-token',
        user: { id: 1, username: 'testuser' },
      },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('testuser', 'password');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('should handle login failure', async () => {
    authAPI.login.mockRejectedValue(
      new Error('Invalid credentials')
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('testuser', 'wrong-password');
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('should handle logout', async () => {
    authAPI.logout.mockResolvedValue({});
    authAPI.getStatus.mockResolvedValue({
      data: { user: { id: 1, username: 'testuser' } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
```

#### src/__tests__/hooks/useLabs.test.js
```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLabs } from '../../hooks/useLabs';
import * as labsAPI from '../../api/labs';

jest.mock('../../api/labs');

describe('useLabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockLabs = [
    { id: 1, name: 'Lab 1', status: 'stopped' },
    { id: 2, name: 'Lab 2', status: 'running' },
  ];

  test('should fetch labs', async () => {
    labsAPI.listLabs.mockResolvedValue({ data: mockLabs });

    const { result } = renderHook(() => useLabs());

    await act(async () => {
      await result.current.fetchLabs();
    });

    expect(result.current.labs).toEqual(mockLabs);
    expect(result.current.loading).toBe(false);
  });

  test('should handle fetch error', async () => {
    labsAPI.listLabs.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLabs());

    await act(async () => {
      try {
        await result.current.fetchLabs();
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.labs).toEqual([]);
  });

  test('should create lab', async () => {
    const newLab = { id: 3, name: 'Lab 3', status: 'stopped' };
    labsAPI.createLab.mockResolvedValue({ data: newLab });

    const { result } = renderHook(() => useLabs());

    await act(async () => {
      result.current.labs = mockLabs; // Set initial state
      await result.current.createLab({ name: 'Lab 3' });
    });

    expect(result.current.labs).toContainEqual(newLab);
  });

  test('should delete lab', async () => {
    labsAPI.deleteLab.mockResolvedValue({});

    const { result } = renderHook(() => useLabs());

    result.current.labs = mockLabs;

    await act(async () => {
      await result.current.deleteLab(1);
    });

    expect(result.current.labs).toEqual(mockLabs.filter(l => l.id !== 1));
  });

  test('should start lab', async () => {
    labsAPI.startLab.mockResolvedValue({ data: { status: 'running' } });

    const { result } = renderHook(() => useLabs());

    await act(async () => {
      await result.current.startLab(1);
    });

    expect(labsAPI.startLab).toHaveBeenCalledWith(1);
    expect(result.current.loading).toBe(false);
  });
});
```

### 2.3 Component Tests

#### src/__tests__/components/LabCard.test.js
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import LabCard from '../../components/LabCard';

describe('LabCard', () => {
  const mockLab = {
    id: 1,
    name: 'Test Lab',
    description: 'Test Description',
    status: 'stopped',
  };

  const mockOnDelete = jest.fn();
  const mockOnStart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render lab card', () => {
    render(
      <LabCard
        lab={mockLab}
        onDelete={mockOnDelete}
        onStart={mockOnStart}
      />
    );

    expect(screen.getByText(mockLab.name)).toBeInTheDocument();
    expect(screen.getByText(mockLab.description)).toBeInTheDocument();
  });

  test('should call onStart when start button is clicked', () => {
    render(
      <LabCard
        lab={mockLab}
        onDelete={mockOnDelete}
        onStart={mockOnStart}
      />
    );

    const startButton = screen.getByText(/start/i);
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalled();
  });

  test('should call onDelete when delete button is clicked', () => {
    render(
      <LabCard
        lab={mockLab}
        onDelete={mockOnDelete}
        onStart={mockOnStart}
      />
    );

    const deleteButton = screen.getByText(/delete/i);
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalled();
  });

  test('should show running status', () => {
    const runningLab = { ...mockLab, status: 'running' };

    render(
      <LabCard
        lab={runningLab}
        onDelete={mockOnDelete}
        onStart={mockOnStart}
      />
    );

    expect(screen.getByText(/running/i)).toBeInTheDocument();
  });
});
```

#### src/__tests__/pages/Login.test.js
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import * as authAPI from '../../api/auth';

jest.mock('../../api/auth');

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render login form', () => {
    renderLogin();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('should handle successful login', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        token: 'test-token',
        user: { id: 1, username: 'testuser' },
      },
    });

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('testuser', 'password');
    });
  });

  test('should display error on login failure', async () => {
    authAPI.login.mockRejectedValue(
      new Error('Invalid credentials')
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

### 2.4 Running Frontend Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- useAuth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="login"

# Update snapshots
npm test -- -u
```

---

## 3. End-to-End Testing

### Structure
```
e2e/
├── support/
│   ├── commands.js
│   ├── helpers.js
│   └── config.js
├── specs/
│   ├── auth.spec.js
│   ├── labs.spec.js
│   ├── lab-workflow.spec.js
│   └── monitoring.spec.js
└── cypress.config.js
```

### 3.1 cypress.config.js
```javascript
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
};
```

### 3.2 E2E Test Examples

#### e2e/specs/auth.spec.js
```javascript
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login successfully', () => {
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('contain', 'admin');
  });

  it('should show error on invalid credentials', () => {
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Invalid credentials'
    );
  });

  it('should logout successfully', () => {
    // Login first
    cy.login('admin', 'password');

    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();

    cy.url().should('include', '/login');
  });
});
```

#### e2e/specs/lab-workflow.spec.js
```javascript
describe('Lab Workflow', () => {
  beforeEach(() => {
    cy.login('admin', 'password');
    cy.visit('/labs');
  });

  it('should create, start, and delete a lab', () => {
    // Create lab
    cy.get('[data-testid="create-lab-button"]').click();
    cy.url().should('include', '/labs/new');

    cy.get('input[name="name"]').type('Test Lab');
    cy.get('textarea[name="description"]').type('Test Description');
    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="success-notification"]').should(
      'contain',
      'Lab created successfully'
    );

    // Start lab
    cy.get('[data-testid="lab-card"]').first().within(() => {
      cy.get('[data-testid="start-button"]').click();
    });

    cy.get('[data-testid="success-notification"]').should(
      'contain',
      'Lab started successfully'
    );

    // Verify lab is running
    cy.get('[data-testid="lab-card"]')
      .first()
      .should('contain', 'running');

    // Delete lab
    cy.get('[data-testid="lab-card"]').first().within(() => {
      cy.get('[data-testid="delete-button"]').click();
    });

    cy.get('[data-testid="confirm-dialog"]').within(() => {
      cy.get('button[type="submit"]').click();
    });

    cy.get('[data-testid="success-notification"]').should(
      'contain',
      'Lab deleted successfully'
    );
  });

  it('should display lab details', () => {
    cy.get('[data-testid="lab-card"]').first().click();

    cy.url().should('match', /\/labs\/\d+/);
    cy.get('[data-testid="lab-details"]').should('be.visible');
    cy.get('[data-testid="nodes-section"]').should('be.visible');
    cy.get('[data-testid="networks-section"]').should('be.visible');
  });
});
```

#### e2e/support/commands.js
```javascript
// Custom commands
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('createLab', (labData) => {
  cy.visit('/labs/new');
  cy.get('input[name="name"]').type(labData.name);
  cy.get('textarea[name="description"]').type(labData.description);
  cy.get('button[type="submit"]').click();
  cy.get('[data-testid="success-notification"]').should('be.visible');
});
```

### 3.3 Running E2E Tests
```bash
# Open Cypress Test Runner
npm run cypress:open

# Run all E2E tests headless
npm run cypress:run

# Run specific test file
npm run cypress:run -- --spec "e2e/specs/auth.spec.js"

# Run with different browser
npm run cypress:run -- --browser chrome
```

---

## 4. Performance Testing

### 4.1 Load Testing Setup
```bash
# Install k6 for load testing
npm install -D k6
```

### 4.2 Load Test Script
```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m30s', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['<0.1'],         // Error rate < 0.1%
  },
};

export default function () {
  // Login
  const loginRes = http.post(
    'http://localhost:8000/api/auth/login',
    JSON.stringify({
      username: 'admin',
      password: 'password',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const token = loginRes.json('token');

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // Get labs
  const labsRes = http.get(
    'http://localhost:8000/api/labs',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  check(labsRes, {
    'labs status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### 4.3 Running Load Tests
```bash
# Run load test
k6 run k6/load-test.js

# Generate HTML report
k6 run k6/load-test.js --out json=report.json
```

---

## 5. Testing Checklist

### Backend Tests
- [ ] Unit tests for all services
- [ ] Unit tests for all models
- [ ] Integration tests for all endpoints
- [ ] Error handling tests
- [ ] Authentication tests
- [ ] Authorization tests
- [ ] Database transaction tests
- [ ] Cache tests
- [ ] Logging/audit tests
- [ ] Achieve 70%+ code coverage

### Frontend Tests
- [ ] Unit tests for all hooks
- [ ] Unit tests for all context providers
- [ ] Component tests for all components
- [ ] Page tests for all pages
- [ ] Error handling tests
- [ ] Loading state tests
- [ ] User interaction tests
- [ ] Navigation tests
- [ ] Achieve 70%+ code coverage

### E2E Tests
- [ ] Login workflow
- [ ] Logout workflow
- [ ] Create lab workflow
- [ ] Update lab workflow
- [ ] Delete lab workflow
- [ ] Start lab workflow
- [ ] Stop lab workflow
- [ ] View lab details workflow
- [ ] View monitoring workflow
- [ ] User profile management

### Performance Tests
- [ ] Load testing (100+ concurrent users)
- [ ] Stress testing (gradual increase to failure)
- [ ] Spike testing (sudden load increase)
- [ ] API response time < 500ms (95th percentile)
- [ ] Error rate < 0.1%
- [ ] Memory usage stable
- [ ] Database connection pooling working

---

## 6. CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: 3.11
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-asyncio pytest-cov pytest-mock
    
    - name: Run tests
      run: |
        cd backend
        pytest tests/ --cov=app --cov-report=xml
      env:
        DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./frontend/coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run E2E tests
      run: |
        npm run cypress:run
```

---

## 7. Test Metrics & Reporting

### Coverage Goals
```
Frontend: 70%+ code coverage
Backend: 70%+ code coverage
Critical paths: 100% coverage

Metrics to track:
- Code coverage percentage
- Test execution time
- Test failure rate
- API response times
- Error rates
- Load test results
```

### Generate Reports
```bash
# Backend coverage report
pytest backend/tests/ --cov=app --cov-report=html
open htmlcov/index.html

# Frontend coverage report
npm test -- --coverage
open coverage/lcov-report/index.html

# Combined report
npm run test:report
```

---

## 8. Testing Best Practices

✅ **Write tests FIRST** (TDD approach)
✅ **Test behavior, not implementation**
✅ **Mock external dependencies** (APIs, databases)
✅ **Keep tests isolated** and independent
✅ **Use clear, descriptive test names**
✅ **Test happy paths AND error cases**
✅ **Achieve high code coverage** (70%+)
✅ **Run tests frequently** (pre-commit, CI/CD)
✅ **Keep tests fast** (< 5 minutes total)
✅ **Maintain test code quality** like production code

---

**Status**: Phase 4 - Testing Guide Complete
**Next Phase**: Phase 5 - Deployment
