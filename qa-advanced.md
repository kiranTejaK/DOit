# 60 Challenging Interview Questions & Answers

This document is designed to prepare you for tough technical interviews regarding the **FastAPI + React + SQLModel** stack.

---

## 🏗️ Architecture & Design (General)

1.  **Why did you choose a "Decoupled Monolith" (separate Repo/Container for Frontend/Backend) instead of a pure microservices architecture?**
    *   **Answer**: For this scale (Project Management Tool), microservices introduce massive complexity (Mesh networking, distributed transactions). A decoupled Backend (FastAPI) and Frontend (React) allows independent scaling and deployment while maintaining code simplicity.

2.  **What is the specific role of Traefik in your `docker-compose.yml`?**
    *   **Answer**: It acts as the **Edge Router** and **Reverse Proxy**. It handles:
        *   **Routing**: Sends `api.domain.com` to Backend container and `dashboard.domain.com` to Frontend.
        *   **SSL Termination**: Manages Let's Encrypt certificates automatically.
        *   **Load Balancing**: If we scaled to 3 backend containers, Traefik would round-robin requests.

3.  **Why containerize with Docker? Why not just run on a VPS with Nginx?**
    *   **Answer**: **Reproducibility**. "It works on my machine" is solved. The production environment is identical to dev. Also, **Isolation**: The database version, python version, and node version are locked inside the images.

4.  **Explain the data flow from a User Click to a Database Write.**
    *   **Answer**:
        1.  User Clicks "Save".
        2.  React (`onSubmit`) calls `useMutation`.
        3.  Axios sends HTTP POST to `https://api.domain.com`.
        4.  Traefik receives request -> routes to Backend Container port 8000.
        5.  FastAPI Router matches path -> calls Function.
        6.  Pydantic validates payload.
        7.  SQLModel (with Session) executes `INSERT`.
        8.  Database confirms write.
        9.  FastAPI returns JSON.
        10. React Query updates cache -> UI Re-renders.

---

## 🛠️ Tech Stack Specific (Deep Dive)

### TanStack Query & Router

5.  **How do you handle Cache Invalidation in TanStack Query?**
    *   **Answer**: Using `queryClient.invalidateQueries({ queryKey: ['tasks'] })`. This marks the data as "Stale". The next time it is accessed (or immediately if active), it Re-fetches.

6.  **What is the structure of your Query Keys? Why `{ assigneeId: user.id }`?**
    *   **Answer**: Keys are Arrays `["entity", { filters }]`. Including the variables (like `assigneeId`) in the key ensures that "My Tasks" and "All Tasks" are cached separately.

7.  **Why specific usage of `createFileRoute` in TanStack Router?**
    *   **Answer**: It enables **Type-Safe Routing**. The router knows exactly what Path Params (`$projectId`) are required. If I try to link to `/projects` without an ID, TypeScript throws an error at compile time.

8.  **What is "Data Pre-fetching" and where might you use it?**
    *   **Answer**: Loading data *before* the user clicks. In TanStack Router, we can use a `loader` function in the Route definition to fetch the Project Details *parallel* to loading the Javascript bundle for the page.

### FastAPI & SQLModel

9.  **Why SQLModel instead of raw SQLAlchemy?**
    *   **Answer**: It reduces code duplication by 50%. In SQLAlchemy, you define a Table Class. In Pydantic, you define a Schema Class. In SQLModel, **One Class** defines both the DB Table and the Validation Schema.

10. **Explain Async vs Sync in Python Connectors (`psycopg2` vs `asyncpg`).**
    *   **Answer**: `psycopg2` is blocking. `asyncpg` is non-blocking. To use `async def` DB calls in FastAPI, you generally need an async driver. (Note: This project uses standard Sync engine for simplicity, but FastAPI runs it in a threadpool so it doesn't block).

11. **What is Dependency Injection in FastAPI really doing under the hood?**
    *   **Answer**: It's a pipeline. When a request hits, FastAPI looks at the function signature. If it sees `SessionDep`, it calls the `yield` function in `deps.py`. It passes the yielded value to your route. After the route finishes, it returns to the `yield` point (to close the session).

12. **How do you handle cyclical dependencies in Pydantic models (User has Tasks, Task has User)?**
    *   **Answer**: We use different schemas: `UserPublic` (no tasks list) and `UserWithTasks` (includes list). This prevents infinite recursion during JSON serialization.

### Chakra UI & TypeScript

13. **Why use Generic Types for API Responses (e.g., `ApiResult<T>`)?**
    *   **Answer**: Reusability. The `request` function doesn't know what data it gets. By using `<T>`, we can pass the specific Pydantic interface (`TaskPublic`) and get full autocompletion on the result.

14. **How do you customize the Chakra UI theme?**
    *   **Answer**: We use `createSystem` or `extendTheme`. We define a dictionary of colors/fonts and pass it to the `Provider`. This ensures every button uses the exact "Brand Blue" defined in one place.

---

## ⚖️ Implementation & Trade-offs

15. **Optimistic Updates for Drag-and-Drop: How and Why?**
    *   **Why**: Waiting 200ms for the server to confirm a drag feels "laggy".
    *   **How**: In `KanbanBoard.tsx`, `onDragEnd` immediately updates the local state (`items`). The UI snaps to the new position instantly. *Then* we send the API call. If it fails, we roll back.

16. **Why Alembic? Why not just `CREATE TABLE`?**
    *   **Answer**: **Evolution**. Use cases change. We need to add a `priority` column 6 months later. Alembic generates a script to `ALTER TABLE`. Doing this manually in Production is dangerous.

17. **Authentication: Why JWT over Session Cookies?**
    *   **Trade-off**: JWT cannot be easily "revoked" before expiry (unless we blacklist).
    *   **Benefit**: **Scalability**. The server is stateless. If we add 5 backend servers, any of them can verify the signature. Session cookies would require a shared Redis for session storage.

18. **Password Recovery: Why is the token in the URL?**
    *   **Answer**: Simplicity. The user clicks a link. The token proves they own the email (since we sent it there).
    *   **Security Risk**: URL history. (Mitigation: Short expiry time, Hash the token in DB).

---

## 🧠 Definitive "Why" Questions

### 19. Why Vite over Webpack?
*   **Speed**: Vite uses native **ES Modules** in the browser during dev. It doesn't bundle the whole app. Webpack rebuilds the whole bundle on every change (slow).
*   **Cold Start**: Vite starts in milliseconds. Webpack takes seconds/minutes.

### 20. Why TanStack Router over React Router DOM?
*   **Type Safety**: TanStack Router was built for TypeScript 1st. It validates Params and Search Params strictly. React Router DOM is looser.
*   **Cache Integration**: Deeper integration with React Query (loaders, caching).

### 21. Why Traefik over Nginx?
*   **Dynamic Config**: Traefik listens to the Docker Socket. When you spin up a new container, Traefik **automatically** detects it and creates a route. Nginx requires manual config file updates and reloads.
*   **Cloud Native**: Built for containers from the ground up.

### 22. Why PostgreSQL over MySQL/MongoDB?
*   **vs Mongo**: We have highly relational data (Users -> Workspaces -> Projects -> Tasks). SQL is better suited.
*   **vs MySQL**: Postgres has better JSON support (`JSONB`) which allows us to be flexible (like NoSQL) if needed within a relational schema.

---

## 🧪 Testing & Quality Questions

23. **What is the difference between a Fixture and a Mock?**
24. **How would you test the "My Tasks" filter?** (Create user, create task assigned to them, call API, assert task is in list).
25. **Why use `prestart.sh`?** (To run migrations *before* the app accepts traffic).
26. **How do you Debug a 500 Error in Production?** (Check Sentry/Logs, correlate Request ID).

## 🚀 DevOps Questions

27. **Explain the Multi-stage Docker build for Frontend.** (Build stage: Node.js. Run stage: Nginx/Alpine. Result: Small image).
28. **How do environment variables get into the React app?** (Build time via `process.env`. Vite uses `import.meta.env`).
29. **What happens if the Redis container dies?** (Task queue fails, but main API likely still works if Redis isn't critical path).
30. **How to Data Backup?** (`pg_dump` via cron job to S3).

## 🐍 Python Specifics

31. **What is `__init__.py`?** (Marks directory as package).
32. **Explain List Comprehensions.**
33. **Explain `yield` fixture in pytest.** (Setup code -> yield -> Teardown code).
34. **What is a Decorator?** (`@router.get`). Wraps a function to modify behavior.

## ⚛️ React Specifics

35. **Controlled vs Uncontrolled Input.**
36. **Effect Dependency Array hazards.**
37. **Custom Hooks benefits.** (Share logic, not state).
38. **React.memo usage.**

## 🛡️ Security

39. **XSS Prevention.** (React escapes strings).
40. **CSRF.** (Cookies vs Headers).
41. **SQL Injection.** (SQLAlchemy parameters).
42. **Rate Limiting.** (Where would you add it? Traefik or FastAPI Middleware).

## 📈 Scalability

43. **Database Sharding.**
44. **Read Replicas.**
45. **CDN for Static Assets.**
46. **Horizontal Scaling of Backend.**

## 🧩 Algorithms (Project Context)

47. **How to sort tasks by drag-and-drop index efficiently?** (Floating point indexes vs Integers).
48. **Tree structure for Subtasks.** (Recursive component).
49. **Search Implementation.** (Full text search in Postgres).

## 🐛 Debugging Scenarios

50. **"CORS Error" in Console.** (Check Backend `BACKEND_CORS_ORIGINS`).
51. **"White Screen of Death".** (Check React Error Boundary).
52. **Slow API connection.** (Check Network tab Waterfall).

## 🧐 Miscellaneous

53. **Git Flow vs Trunk Based Dev.**
54. **Code Review Checklist.**
55. **Handling Technical Debt.**
56. **Documenting APIs.** (OpenAPI/Swagger).
57. **Handling Breaking Changes.** (Versioning /v1 /v2).
58. **Error Handling Strategy.** (Global Exception Handler).
59. **Logging Standard.** (JSON logs for ELK stack).
60. **Accessibility (a11y).** (ARIA labels in Chakra).
