# EVE Lab Automation API

A comprehensive lab automation platform for managing lab lifecycle, deployments, and resource provisioning using FastAPI backend, React frontend, and PostgreSQL database.

## Features

- **Dashboard**: Real-time lab status, running labs count, total labs, provisioning labs, deploy status
- **Lab Management**: Create, deploy, and manage virtual lab environments
- **Provisioning**: Automated lab provisioning with status tracking
- **Deployment**: Deploy labs and manage deployment status
- **Database**: PostgreSQL for persistent data storage
- **API**: RESTful FastAPI backend with comprehensive endpoints
- **Frontend**: React-based responsive UI dashboard

## Tech Stack

- **Backend**: FastAPI, Uvicorn
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Frontend**: React, TypeScript, Axios
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Project Structure

```
.
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py      # FastAPI application entry point
│   │   ├── models.py    # SQLAlchemy models
│   │   ├── schemas.py   # Pydantic schemas
│   │   ├── database.py  # Database configuration
│   │   └── routers/
│   │       ├── labs.py  # Lab endpoints
│   │       ├── deployments.py  # Deployment endpoints
│   │       └── status.py       # Status endpoints
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/            # React application
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LabStatus.tsx
│   │   │   ├── DeploymentForm.tsx
│   │   │   └── StatusCard.tsx
│   │   └── services/
│   │       └── api.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Or: Python 3.9+, Node.js 16+, PostgreSQL 12+

### Using Docker Compose (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Local Development

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost/eve_db"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Labs
- `GET /api/labs` - List all labs
- `POST /api/labs` - Create a new lab
- `GET /api/labs/{lab_id}` - Get lab details
- `PUT /api/labs/{lab_id}` - Update lab
- `DELETE /api/labs/{lab_id}` - Delete lab

### Deployments
- `GET /api/deployments` - List all deployments
- `POST /api/deployments` - Create deployment
- `GET /api/deployments/{deployment_id}` - Get deployment details
- `PUT /api/deployments/{deployment_id}/status` - Update deployment status

### Status
- `GET /api/status/dashboard` - Get dashboard stats
- `GET /api/status/labs/running` - Get running labs count
- `GET /api/status/labs/provisioning` - Get provisioning labs

## Environment Variables

See `.env.example` for all available configuration options.

## Development

```bash
# Run tests
pytest backend/

# Format code
black backend/

# Lint
flake8 backend/
```

## License

MIT
