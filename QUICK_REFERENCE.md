# API EVE-NG - Quick Reference Guide

## Essential Commands

### Local Development
```bash
# Backend Setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload

# Frontend Setup
cd frontend
npm install
cp .env.example .env
npm start

# Run Tests
cd backend && pytest tests/ --cov=app
cd frontend && npm test -- --coverage
```

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run command in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Database operations
docker-compose exec db psql -U eve_user -d eve_db
```

### Database Operations
```bash
# Create backup
./scripts/backup-database.sh

# Restore backup
./scripts/restore-database.sh backups/eve_ng_backup_YYYYMMDD_HHMMSS.sql.gz

# Run migrations
docker-compose exec backend alembic upgrade head

# Create migration
alembic revision --autogenerate -m "Description"
```

---

## Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://eve_user:password@db:5432/eve_db

# EVE-NG
EVE_NG_FQDN=evengvlab4you.ddns.net
EVE_NG_PORT=8443
EVE_NG_PROTOCOL=https
EVE_NG_USERNAME=admin
EVE_NG_PASSWORD=password
EVE_NG_VERIFY_SSL=false

# Security
SECRET_KEY=<your-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100

# Logging
LOG_LEVEL=info
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_BASE_URL=/api
```

---

## API Endpoints Summary

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| GET | /api/auth/status | Check auth status |
| POST | /api/auth/refresh | Refresh token |

### Labs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/labs | List labs |
| POST | /api/labs | Create lab |
| GET | /api/labs/{id} | Get lab details |
| PUT | /api/labs/{id} | Update lab |
| DELETE | /api/labs/{id} | Delete lab |
| POST | /api/labs/{id}/start | Start lab |
| POST | /api/labs/{id}/stop | Stop lab |

### Nodes & Networks
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/labs/{lab_id}/nodes | List nodes |
| POST | /api/labs/{lab_id}/nodes | Create node |
| GET | /api/labs/{lab_id}/networks | List networks |
| POST | /api/labs/{lab_id}/networks | Create network |

---

## File Structure Cheat Sheet

### Backend Key Files
```
backend/
├── app/main.py              - FastAPI app setup
├── app/database.py          - Database connection
├── app/config.py            - Configuration
├── app/api/                 - HTTP endpoints
├── app/services/            - Business logic
├── app/models/              - Database models
├── app/schemas/             - Pydantic schemas
├── app/middleware/          - Middleware
├── tests/                   - Test files
└── requirements.txt         - Dependencies
```

### Frontend Key Files
```
frontend/
├── src/api/                 - API clients
├── src/hooks/               - Custom hooks
├── src/context/             - Context providers
├── src/pages/               - Page components
├── src/components/          - Reusable components
├── src/App.js               - Root component
└── package.json             - Dependencies
```

---

## Common Tasks

### Adding a New API Endpoint
```python
# 1. Create schema in app/schemas/
class LabCreate(BaseModel):
    name: str
    description: str

# 2. Create router in app/api/
@router.post("/")
async def create_lab(lab_data: LabCreate, db: Session = Depends(get_db)):
    # Implementation
    pass

# 3. Include router in app/main.py
app.include_router(labs.router, prefix="/api/labs")
```

### Adding a Frontend Hook
```javascript
// 1. Create hook in src/hooks/
export const useMyFeature = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    // Implementation
  };
  
  return { data, loading, fetchData };
};

// 2. Use in component
const MyComponent = () => {
  const { data, loading, fetchData } = useMyFeature();
  // Implementation
};
```

### Creating a Database Migration
```bash
# Create migration
alembic revision --autogenerate -m "Add users table"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Running Tests
```bash
# All backend tests
pytest backend/tests/

# Specific test file
pytest backend/tests/unit/test_auth_service.py

# With coverage
pytest backend/tests/ --cov=app --cov-report=html

# Frontend tests
npm test

# E2E tests
npm run cypress:run
```

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Verify database connection
docker-compose exec db psql -U eve_user -c "SELECT 1"

# Restart service
docker-compose restart backend

# Check if port 8000 is in use
lsof -i :8000
```

### Frontend Connection Issues
```bash
# Check if backend is running
curl http://localhost:8000/api/system/health

# Clear frontend cache
rm -rf node_modules .next
npm install

# Check API URL in .env
cat frontend/.env
```

### Database Issues
```bash
# View active connections
docker-compose exec db psql -U eve_user -d eve_db -c "SELECT * FROM pg_stat_activity;"

# Kill connections
docker-compose exec db psql -U eve_user -d eve_db -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'eve_db';"

# Restart database
docker-compose restart db
```

### Migration Issues
```bash
# View migration history
alembic history

# Current version
alembic current

# Downgrade and upgrade
alembic downgrade -1
alembic upgrade +1
```

---

## Performance Tips

### Database
- Add indexes: `CREATE INDEX idx_name ON table(column);`
- Check slow queries: Enable query logging
- Monitor connections: `SELECT count(*) FROM pg_stat_activity;`

### API
- Use pagination: `?limit=10&offset=0`
- Cache responses: Set `Cache-Control` headers
- Compress responses: Enable gzip in nginx

### Frontend
- Lazy load components: `React.lazy(() => import('./Component'))`
- Code splitting: Automatic with Create React App
- Optimize images: Use tools like imagemin

---

## Security Checklist

- [ ] HTTPS/TLS enabled in production
- [ ] Rate limiting configured
- [ ] CORS whitelist set
- [ ] JWT secrets strong and rotated
- [ ] Database backups automated
- [ ] Logging enabled and monitored
- [ ] Security headers added to responses
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (HTTP-only cookies)
- [ ] CSRF protection (SameSite cookies)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] SSL certificates ready

### Deployment
- [ ] Build Docker images
- [ ] Run database migrations
- [ ] Deploy containers
- [ ] Verify health checks
- [ ] Check error logs
- [ ] Monitor metrics

### Post-Deployment
- [ ] Test critical features
- [ ] Monitor error rates
- [ ] Check performance
- [ ] Document any issues
- [ ] Update status page

---

## Useful Links

### Documentation
- [Architecture](./ARCHITECTURE.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [API Endpoints](./API_ENDPOINTS.md)
- [Phase 3: Frontend](./PHASE_3_FRONTEND_REFACTORING.md)
- [Phase 4: Testing](./PHASE_4_TESTING.md)
- [Phase 5: Deployment](./PHASE_5_DEPLOYMENT.md)

### External Resources
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Docs](https://docs.docker.com/)
- [Pytest Docs](https://docs.pytest.org/)
- [React Testing Library](https://testing-library.com/react)

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes
git add .
git commit -m "feat: description"

# Push to GitHub
git push origin feature/feature-name

# Create Pull Request on GitHub
# After review and tests pass, merge to main

# Update local
git checkout main
git pull origin main
git branch -d feature/feature-name
```

---

## Version Info

| Component | Version |
|-----------|---------|
| Python | 3.11+ |
| FastAPI | 0.100+ |
| React | 18+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |
| Docker | 20.10+ |

---

## Support & Resources

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check docs/ folder
- **Discussions**: GitHub Discussions for questions
- **Email**: admin@example.com

---

## Quick Links

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

---

**Last Updated**: 2026-07-21
**Status**: Production Ready ✅
