# Developer Instructions - DOit

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js & npm (for local frontend dev if not using Docker)

### Getting Started
1. **Clone the repository.**
2. **Environment Variables**:
   - Copy `.env.example` to `.env`.
   - Ensure `POSTGRES_PASSWORD`, `SECRET_KEY`, etc. are set.
   - For Emails: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.
   - For Redis: `REDIS_HOST=redis` (default in docker-compose).
3. **Start Services**:
   ```bash
   docker compose up -d
   ```
   This starts Postgres, Redis, Backend (API), Frontend, and Adminer.

4. **Access Applications**:
   - Frontend: `http://localhost:5173` (or configured port).
   - Backend API Docs: `http://localhost:8000/docs`.
   - Adminer (DB GUI): `http://localhost:8080`.

### Database Migrations
When changing models in `backend/app/models.py`:
1. Generate migration:
   ```bash
   docker compose run --rm --no-deps backend alembic revision --autogenerate -m "Message"
   ```
2. Apply migration (happens automatically on restart, or manually):
   ```bash
   docker compose run --rm --no-deps backend alembic upgrade head
   ```

### Redis
Redis is available at `redis:6379` within the docker network.
- To use it in backend: Import `redis_client` from `app.core.redis_client`.
- To verify: `docker compose exec redis redis-cli ping`.

## Production Deployment

### Maintenance
- **Backups**: Periodically backup the `app-db-data` volume.
- **Updates**:
    ```bash
    git pull
    docker compose build
    docker compose up -d
    ```
    Migrations will run automatically on container startup if configured in `prestart.sh`.

### Environment Variables for Integrations
Ensure these are set in production `.env`:

**Email (SMTP)**:
- `SMTP_HOST`: e.g., `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_USER`: Your email
- `SMTP_PASSWORD`: App Password (if using Gmail with 2FA)
- `SMTP_TLS`: `True`
- `EMAILS_FROM_EMAIL`: Address emails come from.

**Redis**:
- `REDIS_HOST`: Hostname (default `redis` in docker).
- `REDIS_PORT`: Port (default `6379`).

**Domain**:
- `DOMAIN`: Your production domain.
- `FRONTEND_HOST`: URL of the frontend (for email links).
