# Interview Questions & Answers (50+)

This document covers detailed technical and implementation questions regarding the stack: **FastAPI, React, SQLModel, PostgreSQL, Docker, Alembic, S3, SMTP**.

---

## 🔥 FastAPI & Backend

1.  **What is FastAPI and why is it fast?**
    *   FastAPI is a modern web framework for building APIs with Python 3.6+. It is "fast" because it uses **Starlette** for web routing (asynchronous) and **Pydantic** for data validation, both of which are highly optimized. It runs on **ASGI** (Asynchronous Server Gateway Interface) servers like Uvicorn.

2.  **What is the difference between WSGI and ASGI?**
    *   **WSGI** (Web Server Gateway Interface) is synchronous (blocking). Use cases: Flask, Django.
    *   **ASGI** is asynchronous (non-blocking). It handles many connections concurrently (WebSockets, long polling). FastAPI uses ASGI.

3.  **How does Dependency Injection work in FastAPI?**
    *   It's a system where you declare "dependencies" (functions or classes) that your path operation needs. FastAPI executes them before your route logic. Example: `SessionDep` creates a DB session, `CurrentUser` validates the token.

4.  **What is Pydantic used for in this project?**
    *   Data validation. We define schemas (e.g., `TaskCreate`) with types. Pydantic ensures incoming JSON matches these types; otherwise, it throws a 422 Validation Error.

5.  **Explain the difference between `Topic` (SQLModel) and `TopicPublic` (Pydantic Schema).**
    *   `Topic` (SQLModel): Represents the database table structure. Contains sensitive data (hashed passwords).
    *   `TopicPublic`: A "Response Model". It filters out sensitive fields (shows only what the API consumer should see).

6.  **How do you handle asynchronous database operations?**
    *   FastAPI is async (`async def`), but standard SQLAlchemy is sync. We use the **synchronous** engine in this project because `SQLModel`'s async support was experimental at start. However, FastAPI runs the route in a threadpool so it doesn't block the main event loop.

7.  **What is the role of `APIRouter`?**
    *   It allows us to split the application into multiple files (`users.py`, `items.py`). We define routes in these files and "include" them in the main app instance in `main.py`.

8.  **How is CORS handled?**
    *   We use `CORSMiddleware`. It's configured in `main.py` using `BACKEND_CORS_ORIGINS` from `.env`. It allows the Frontend (running on a different port/domain) to communicate with the Backend.

9.  **What is a JWT?**
    *   JSON Web Token. It's a stateless authentication mechanism. It has 3 parts: Header, Payload (User ID, Expiry), and Signature (signed with `SECRET_KEY`).

10. **Why verify the JWT on every request instead of using sessions?**
    *   Statelessness. The server doesn't need to store "who is logged in". It scales better horizontally (multiple servers don't need shared session storage).

---

## 🗄️ Database (PostgreSQL & SQLModel)

11. **What is SQLModel?**
    *   A combination of **SQLAlchemy** (ORM) and **Pydantic**. It allows defining one class that serves as both a Database Table and a Validation Schema.

12. **What is an ORM?**
    *   Object-Relational Mapper. It translates Python classes/objects to SQL database tables/rows.

13. **What is a "Migration" in database terms?**
    *   A version control system for your database schema. If you add a column to a model, a migration applies that change to the database without deleting existing data.

14. **How does Alembic work in this project?**
    *   `alembic revision --autogenerate`: Scans `models.py` and compares it to the current DB state. Creates a script.
    *   `alembic upgrade head`: Runs the script to apply changes to the DB.

15. **What is the difference between `Session.add()` and `Session.commit()`?**
    *   `add()`: Adds the object to the session (staging area).
    *   `commit()`: Actually sends the `INSERT` or `UPDATE` SQL command to the database and makes it permanent.

16. **Why do we use `Session.refresh(obj)`?**
    *   After a commit, the object in Python might be stale (e.g., it doesn't have the auto-generated ID or default values from DB). `refresh` reloads it from the DB.

17. **What is a Foreign Key?**
    *   A field that links to the Primary Key of another table (e.g., `Task.project_id` links to `Project.id`).

18. **Explain "Lazy Loading" vs "Eager Loading".**
    *   Lazy: Related data is not fetched until you access the property (e.g., `task.project`). Can cause "N+1" problems.
    *   Eager: Related data is fetched in the *initial query* using `.join()`. We used this in `tasks.py` to get `project_name` efficiently.

---

## ⚛️ Frontend (React & TanStack)

19. **What is a Hook in React?**
    *   Functions that let you "hook into" React state and lifecycle features (e.g., `useState`, `useEffect`).

20. **Why use TanStack Query (React Query) instead of `useEffect` with `fetch`?**
    *   It handles global state, caching, deduping, background refetching, and loading/error states automatically. Doing this manually is error-prone.

21. **What is "Query Invalidation"?**
    *   When we change data (e.g., Add Task), the cached list of tasks is now old ("stale"). Invalidating the query forces React Query to re-fetch the fresh list immediately.

22. **What is the Virtual DOM?**
    *   A lightweight JavaScript representation of the DOM. React updates this first, compares it to the previous version ("diffing"), and only updates the minimal necessary parts of the actual DOM.

23. **What is Prop Drilling and how do we avoid it?**
    *   Passing data down through many layers of components. We avoid it using **Context API** (like `AuthProvider`) or State Management Libraries (React Query).

24. **Explain the `key` prop in React lists.**
    *   It helps React identify which items have changed, added, or removed. It must be unique (e.g., `task.id`). Using `index` is bad practice as it breaks if the list is reordered.

25. **What is Chakra UI?**
    *   A component library providing accessible, themeable UI components (Box, Flex, Button). It uses CSS-in-JS (Emotion) for styling.

26. **What is Client-Side Routing?**
    *   The URL changes, but the browser does *not* request a new HTML page from the server. JavaScript (React Router) intercepts the URL and renders the correct component. This makes the app feel faster (SPA).

27. **How does `useForm` (React Hook Form) improve performance?**
    *   It uses "uncontrolled inputs" (ref-based) by default, meaning input typing doesn't trigger a full React re-render for every keystroke, unlike controlled state.

---

## 🏗️ DevOps (Docker, Traefik)

28. **What is Docker?**
    *   A platform to package applications and their dependencies into "containers". It ensures the app runs the same on your laptop and the server.

29. **What is Docker Compose?**
    *   A tool to define and run multi-container Docker applications. We use `docker-compose.yml` to run Backend, Frontend, DB, and Proxy together.

30. **What is Traefik?**
    *   A modern reverse proxy and load balancer. In this project, it sits in front of our services, routing traffic (e.g., `api.domain.com` -> Backend container, `dashboard.domain.com` -> Frontend container).

31. **What are Docker "Images" vs "Containers"?**
    *   **Image**: The blueprint/template (read-only).
    *   **Container**: The running instance of an image (read-write).

32. **Why do we use a multi-stage Docker build for the frontend?**
    *   Build Stage: Has Node.js installed to run `npm run build`.
    *   Final Stage: Uses minimal Nginx image to *serve* the static files. This keeps the final image size very small (no Node.js included).

33. **What is a Healthcheck in Docker?**
    *   A command run inside the container to check if it's healthy (e.g., `curl localhost:8000/health`). Dependent services (like Backend relying on DB) wait for this to pass before starting.

---

## 📧 Email & SMTP

34. **How are emails sent asynchronously?**
    *   Ideally, we put email tasks in a queue (Celery/Redis). In this simple implementation, they are sent directly, which can block the request. This is a potential improvement point.

35. **What is Jinja2?**
    *   A templating engine for Python. We use it to inject dynamic variables (like `username`, `link`) into our HTML email templates.

36. **What is SMTP?**
    *   Simple Mail Transfer Protocol. The standard protocol for sending emails.

37. **What is TLS in SMTP context?**
    *   Transport Layer Security. It encrypts the connection between our app and the email server so passwords and email content aren't intercepted.

---

## ☁️ Infrastructure & AWS S3 (If implemented)

38. **What is S3?**
    *   Amazon Simple Storage Service. Object storage for files.

39. **Why use S3 for images instead of the local filesystem?**
    *   **Statelessness**: If we have 2 backend servers, storing a file on Server A means Server B can't see it. S3 is central.
    *   **Persistence**: Docker containers are ephemeral; files are lost if the container dies (unless volumes are used). S3 is permanent.

40. **What are Pre-signed URLs?**
    *   Instead of making the file "Public", the backend generates a URL with a temporary signature allowing read access for 5 minutes. Secure way to share private files.

---

## 🛠️ Implementation Specific Questions

41. **How did you implement the "Kanban Board"?**
    *   I used a library (`dnd-kit` or similar) for drag-and-drop. The board has columns. Moving a task triggers an API call (`updateTask`) to change the task's status (e.g., from "Todo" to "In Progress").

42. **How did you implement Role-Based Access?**
    *   I added a `role` field to `WorkspaceMember`. When fetching data, I check `if member.role == 'owner'`.

43. **Why did the "My Tasks" view need a backend change for Project Color?**
    *   The `Task` table has `project_id`, but not `project_name` or `color`. Fetching projects individually for every task (N+1) is slow. I modified the backend query to `JOIN` the `Project` table and return the extra data in a single query.

44. **How do you handle migrations in Production?**
    *   We use a `prestart.sh` script in Docker. Before the backend server starts, it runs `alembic upgrade head` to ensure the DB schema is up to date.

45. **What happens if the Database is down?**
    *   FastAPI will throw a 500 error when trying to connect. The Docker Healthcheck will fail, and Docker might try to restart the backend container.

46. **How do you secure passwords?**
    *   We **hash** them using `bcrypt` (via `passlib`). We never store plain text passwords. We verify by hashing the input and comparing the hashes.

47. **What is the purpose of `types.gen.ts`?**
    *   It is auto-generated from the Backend's `openapi.json`. It guarantees that our Frontend TypesScript types perfectly match the Backend Python models. Eliminates "type mismatches".

48. **How does the Login Persistence work?**
    *   On login, the token is saved to `localStorage`.
    *   On app load (`_layout.tsx`), we check if the token exists.
    *   `useAuth` attempts to fetch `/users/me`. If it fails (401), we clear storage and redirect to login.

49. **How would you scale this application?**
    *   **Backend**: Run multiple containers behind a Load Balancer (Traefik/AWS ALB).
    *   **Database**: Use a managed DB (RDS) with Read Replicas.
    *   **Frontend**: Serve static files via CDN (Cloudfront).

50. **What was the hardest bug you fixed in this project?**
    *   *(Answer based on conversation)*: Fixing the generic internal server errors by ensuring proper error propagation, or debugging the "distorted" task view by moving the Drawer component out of the table structure to ensure valid HTML.
