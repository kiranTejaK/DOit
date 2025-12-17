# Backend Documentation & API Reference

This document provides a comprehensive guide to the Backend architecture, modules, and API endpoints.

## 🏗️ Architecture Stack

-   **Framework**: FastAPI (Async, Typed)
-   **Database**: PostgreSQL 17
-   **ORM**: SQLModel (SQLAlchemy + Pydantic)
-   **Migrations**: Alembic
-   **Task Queue**: Redis (Available but not heavily used yet)
-   **Containerization**: Docker & Docker Compose
-   **Proxy**: Traefik (Handles SSL/Reverse Proxy)

---

## 📂 Project Structure

```bash
backend/app/
├── api/
│   ├── routes/          # API Controllers (Endpoints)
│   │   ├── login.py     # Auth & Password Recovery
│   │   ├── users.py     # User Management
│   │   ├── tasks.py     # Task CRUD
│   │   ├── projects.py  # Project CRUD
│   │   ├── workspaces.py# Workspace CRUD
│   │   └── ...
│   └── deps.py          # Dependency Injection (Session, Auth)
├── core/
│   ├── config.py        # Environment Variables (Pydantic Settings)
│   ├── db.py            # Database Engine & Initialization
│   └── security.py      # JWT & Password Hashing
├── models.py            # Database Tables & Pydantic Schemas
├── utils.py             # Email Sending & Template Rendering
└── main.py              # App Entrypoint
```

---

## 🔌 API Endpoints Reference

### 1. Authentication (`/api/v1/login`)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/login/access-token` | Authenticates user (OAuth2 Password Flow). Return JWT. | Public |
| `POST` | `/login/test-token` | Tests if token is valid. Returns User object. | Auth |
| `POST` | `/password-recovery/{email}` | Sends password recovery email. | Public |
| `POST` | `/reset-password/` | Resets password using token. | Public |

### 2. Users (`/api/v1/users`)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create User (Admin only). | Superuser |
| `GET` | `/` | List Users (with pagination). | Superuser |
| `GET` | `/me` | Get current user profile. | Auth |
| `PATCH`| `/me` | Update current user profile. | Auth |
| `PATCH`| `/{user_id}` | Update specific user. | Superuser |
| `POST` | `/signup` | Register new user (Self-registration). | Public |
| `DELETE`| `/{user_id}`| Delete user. | Superuser |

### 3. Workspaces (`/api/v1/workspaces`)
The top-level container for organization.
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create new workspace. Sets creator as Owner. | Auth |
| `GET` | `/` | List workspaces user belongs to. | Auth |
| `GET` | `/{id}` | Get workspace details. | Member |
| `PUT` | `/{id}` | Update workspace. | Owner/Member |
| `DELETE`| `/{id}` | Delete workspace. | Owner |
| `GET` | `/{id}/members` | List workspace members + roles (Owner/Member). | Member |

### 4. Projects (`/api/v1/projects`)
Projects belong to Workspaces.
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create Project within a workspace. | Auth |
| `GET` | `/` | List Projects. | Auth |
| `GET` | `/{id}` | Get Project details. | Member |
| `PUT` | `/{id}` | Update Project. | Owner/Member |
| `DELETE`| `/{id}` | Delete Project. | Owner |

### 5. Tasks (`/api/v1/tasks`)
Tasks belong to Projects.
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create Task. | Project Member |
| `GET` | `/` | List Tasks. Supports filters (`project_id`, `assignee_id`). Returns Project Name/Color. | Auth |
| `GET` | `/{id}` | Get Task details. | Auth |
| `PUT` | `/{id}` | Update Task. | Auth |
| `DELETE`| `/{id}` | Delete Task. | Creator/Owner |

### 6. Invitations (`/api/v1/invitations`)
Handles inviting users to workspaces.
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create invitation (Send email). | Workspace Owner |
| `GET` | `/{token}` | Read invitation details from token. | Public |
| `POST` | `/accept` | Accept invitation. Adds user to workspace. | Auth |

---

## ⚙️ Core Modules Implementation

### 📧 Email System (`utils.py`)
-   **Library**: Uses `smtplib` (standard library) and `jinja2` for templates.
-   **Flow**:
    1.  `render_email_template`: Loads HTML from `app/email-templates`.
    2.  `send_email`: Connects to SMTP server (configured in `.env`), performs TLS handshake, and sends `MIMEMultipart` message.

### 💾 Database & ORM (`models.py`, `core/db.py`)
-   **SQLModel**: We define classes like `class User(SQLModel, table=True)`.
-   **Migrations**: Alembic detects changes in these models and generates SQL scripts (versions) to update the DB schema.
-   **Session**: `SessionDep` yields a `Session` for each request. Changes are committed only after successful execution.

### 🔒 Security (`core/security.py`)
-   **Hashing**: Passwords are hashed using `bcrypt`.
-   **Tokens**: JWTs are signed with `HS256`.
-   **Expiry**: Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (defaults to 8 days in some configs).
