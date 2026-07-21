# API Endpoints Documentation

## Overview

All endpoints follow RESTful conventions and return JSON responses.

**Base URL**: `http://backend:8000/api` (development)

**Authentication**: JWT token in HTTP-only cookie (automatically set on login)

---

## Authentication Endpoints

### POST /auth/login

Authenticate user with EVE-NG.

**Request**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "username": "admin"
}
```

**Errors**:
- 400: Missing username or password
- 401: Invalid credentials
- 503: EVE-NG not available

**Cookie Set**:
```
Set-Cookie: eve_ng_session=<token>; HttpOnly; Secure; SameSite=Strict
```

---

### POST /auth/logout

Logout user and clear session.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### GET /auth/status

Check authentication status.

**Response** (200 OK):
```json
{
  "authenticated": true,
  "username": "admin"
}
```

**If not authenticated** (200 OK):
```json
{
  "authenticated": false,
  "username": null
}
```

---

## Labs Endpoints

### GET /labs

List all labs.

**Query Parameters**:
- `skip` (int, default=0): Pagination offset
- `limit` (int, default=100): Number of results

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "OSPF Lab",
      "description": "Advanced OSPF configuration",
      "status": "running",
      "created_at": "2024-01-15T10:30:00Z",
      "deployed_at": "2024-01-15T10:35:00Z"
    }
  ],
  "count": 1
}
```

---

### GET /labs/{lab_id}

Get details of a specific lab.

**Path Parameters**:
- `lab_id` (int): Lab ID

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "OSPF Lab",
  "description": "Advanced OSPF configuration",
  "status": "running",
  "topology": {...},
  "created_at": "2024-01-15T10:30:00Z",
  "deployed_at": "2024-01-15T10:35:00Z"
}
```

**Errors**:
- 404: Lab not found
- 503: EVE-NG not available

---

### POST /labs

Create a new lab.

**Request**:
```json
{
  "name": "New Lab",
  "description": "Lab description",
  "topology": {
    "nodes": [...],
    "links": [...]
  }
}
```

**Response** (201 Created):
```json
{
  "id": 5,
  "name": "New Lab",
  "description": "Lab description",
  "status": "pending",
  "created_at": "2024-01-16T10:30:00Z"
}
```

**Errors**:
- 400: Invalid request data
- 409: Lab name already exists
- 503: EVE-NG not available

---

### PUT /labs/{lab_id}

Update a lab.

**Path Parameters**:
- `lab_id` (int): Lab ID

**Request**:
```json
{
  "name": "Updated Lab Name",
  "description": "Updated description",
  "topology": {...}
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Updated Lab Name",
  "description": "Updated description",
  "updated_at": "2024-01-16T10:30:00Z"
}
```

**Errors**:
- 404: Lab not found
- 503: EVE-NG not available

---

### DELETE /labs/{lab_id}

Delete a lab.

**Path Parameters**:
- `lab_id` (int): Lab ID

**Response** (204 No Content):

**Errors**:
- 404: Lab not found
- 503: EVE-NG not available

---

### POST /labs/{lab_id}/start

Start a lab.

**Path Parameters**:
- `lab_id` (int): Lab ID

**Response** (200 OK):
```json
{
  "success": true,
  "status": "starting",
  "message": "Lab started"
}
```

**Errors**:
- 404: Lab not found
- 409: Lab already running
- 503: EVE-NG not available

---

### POST /labs/{lab_id}/stop

Stop a lab.

**Path Parameters**:
- `lab_id` (int): Lab ID

**Response** (200 OK):
```json
{
  "success": true,
  "status": "stopped",
  "message": "Lab stopped"
}
```

**Errors**:
- 404: Lab not found
- 409: Lab already stopped
- 503: EVE-NG not available

---

### GET /labs/{lab_id}/stats

Get lab statistics.

**Path Parameters**:
- `lab_id` (int): Lab ID

**Response** (200 OK):
```json
{
  "node_count": 5,
  "running_nodes": 5,
  "cpu_usage": 45.2,
  "memory_usage": 2048,
  "uptime_seconds": 3600
}
```

---

## Nodes Endpoints

### GET /nodes

List all nodes.

**Query Parameters**:
- `lab_id` (int, optional): Filter by lab

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "lab_id": 1,
      "name": "R1",
      "type": "Cisco IOS",
      "status": "running"
    }
  ]
}
```

---

### GET /nodes/{node_id}

Get node details.

**Response** (200 OK):
```json
{
  "id": 1,
  "lab_id": 1,
  "name": "R1",
  "type": "Cisco IOS",
  "status": "running",
  "console": 5000,
  "image": "vios-15.9"
}
```

---

### POST /nodes/{node_id}/start

Start a node.

**Response** (200 OK):
```json
{
  "success": true,
  "status": "starting"
}
```

---

### POST /nodes/{node_id}/stop

Stop a node.

**Response** (200 OK):
```json
{
  "success": true,
  "status": "stopped"
}
```

---

## Status Endpoints

### GET /status

Get system status.

**Response** (200 OK):
```json
{
  "system": {
    "cpu_percent": 45.2,
    "memory_percent": 62.1,
    "disk_percent": 78.5,
    "uptime_seconds": 864000
  },
  "eve_ng": {
    "connected": true,
    "version": "5.0.0"
  },
  "database": {
    "connected": true,
    "status": "healthy"
  }
}
```

---

### GET /status/cluster

Get cluster status.

**Response** (200 OK):
```json
{
  "nodes": 3,
  "active_nodes": 3,
  "cpu_total": 128,
  "memory_total_gb": 512,
  "memory_available_gb": 256
}
```

---

## Monitoring Endpoints

### GET /monitoring/metrics

Get system metrics.

**Query Parameters**:
- `time_range` (string): "1h", "24h", "7d" (default: "1h")

**Response** (200 OK):
```json
{
  "timestamp": "2024-01-16T10:30:00Z",
  "metrics": {
    "cpu": [45.2, 46.1, 45.8, ...],
    "memory": [2048, 2100, 2050, ...],
    "disk": [1024, 1024, 1024, ...]
  }
}
```

---

### WebSocket /ws/monitoring

Real-time monitoring updates.

**Connection**:
```javascript
const ws = new WebSocket('ws://backend:8000/ws/monitoring');
```

**Message** (incoming):
```json
{
  "type": "metrics_update",
  "data": {
    "cpu": 45.2,
    "memory": 2048,
    "disk": 1024,
    "timestamp": "2024-01-16T10:30:00Z"
  }
}
```

---

## Error Responses

All errors return JSON with:

```json
{
  "detail": "Error message",
  "status_code": 400,
  "timestamp": "2024-01-16T10:30:00Z"
}
```

### Common Status Codes

| Code | Meaning |
|------|----------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limiting

API endpoints are rate limited:
- **Default**: 100 requests per minute per user
- **Auth endpoints**: 5 requests per minute

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642339800
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}' \
  -c cookies.txt
```

### List Labs
```bash
curl -X GET http://localhost:8000/api/labs \
  -b cookies.txt
```

### Create Lab
```bash
curl -X POST http://localhost:8000/api/labs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Lab",
    "description": "Test description",
    "topology": {}
  }'
```

### Start Lab
```bash
curl -X POST http://localhost:8000/api/labs/1/start \
  -b cookies.txt
```

---

## Testing with Postman

1. **Import Collection**: Use `postman_collection.json`
2. **Set Environment Variables**:
   - `base_url`: http://localhost:8000
   - `username`: admin
   - `password`: password
3. **Run Collection**: Click "Run"

---

## OpenAPI Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These auto-generated docs are always in sync with the code.
