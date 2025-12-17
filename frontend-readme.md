# Frontend Documentation & Component Reference

This document provides a comprehensive analysis of the Frontend structure, including detailed descriptions of all modules and components.

## 🏗️ Architecture Stack

-   **Framework**: React 18
-   **Build Tool**: Vite (Fast HMR)
-   **Language**: TypeScript
-   **Routing**: TanStack Router (File-based)
-   **State/API**: TanStack Query (React Query) v5
-   **UI Library**: Chakra UI (v3/Next)
-   **Icons**: React Icons (Feather Icons mostly)

---

## 📂 Project Structure

```bash
frontend/src/
├── client/              # OpenAPI Generated Code
│   ├── services/        # API Service Functions (TasksService, etc.)
│   ├── models/          # TypeScript Interfaces (TaskPublic, etc.)
│   └── core/            # Axios wrapper & Config
├── components/          # Reusable UI Blocks
│   ├── Common/          # Shared (Sidebar, NotFound, Navbar)
│   ├── Tasks/           # Task-specific (Add, Edit, List)
│   ├── Projects/        # Project-specific (Kanban)
│   └── ...
├── hooks/               # Custom Hooks (useAuth)
├── routes/              # Application Pages (File-based)
│   ├── _layout/         # Protected Routes wrapper
│   │   ├── tasks.tsx    # "My Tasks" Page
│   │   ├── projects.tsx # Projects List
│   │   └── ...
│   ├── login.tsx        # Login Page
│   └── signup.tsx       # Signup Page
└── theme/               # Chakra UI Theme Customizations
```

---

## 🧩 Component Modules Reference

### 1. Common Components (`src/components/Common`)
These are global components used across the application.
-   **`Sidebar.tsx`**: The main navigation bar on the left. Contains logic to expand/collapse.
-   **`SidebarItems.tsx`**: The list of links (Dashboard, Projects, etc.). Hides "Admin" if user is not superuser.
-   **`Navbar.tsx`**: Top header (on mobile) or supplementary navigation.
-   **`NotFound.tsx`**: 404 Error Page.
-   **`UserMenu.tsx`**: Profile dropdown (Logout, Settings).

### 2. Task Module (`src/components/Tasks`)
Handles all task-related UI logic.
-   **`AddTask.tsx`**:
    -   **Type**: Modal (Dialog).
    -   **Function**: Contains form (React Hook Form) to create a task. Fetches Projects/Members for dropdowns.
-   **`TaskDetails.tsx`**:
    -   **Type**: Drawer (Side Panel) / Wrapper.
    -   **Function**: Displays full details (Description, Assignee).
    -   **Logic**: Can function as a clickable wrapper (My Tasks) or a standalone modal. Fetches Comments.
-   **`TaskTableRow.tsx`**:
    -   **Type**: Component.
    -   **Function**: Renders a single task as a table row (used in Kanban lists mostly).

### 3. Project Module (`src/components/Projects`)
Handles project visualization.
-   **`AddProject.tsx`**: Modal form to create a new project.
-   **`KanbanBoard.tsx`**:
    -   **Core Feature**: Drag-and-drop interface (`dnd-kit`).
    -   **Logic**: Organizes tasks into columns (Todo/Doing/Done). Handles `onDragEnd` events to update backend.
-   **`KanbanColumn.tsx`**: Renders a single column in the board.

### 4. Admin Module (`src/components/Admin`)
Only accessible to Superusers.
-   **`AddUser.tsx`**: Modal to create new users manually.
-   **`EditUser.tsx`**: Modal to update user permissions/details.

### 5. Items/Pending (`src/components/Items`, `Pending`)
Example/Template modules usually used for testing or boilerplate functionality.
-   **`AddItem.tsx`**: Basic CRUD example.
-   **`PendingItems.tsx`**: Placeholder/Loading state components.

---

## 📡 API Integration Detail

### OpenAPI Client Generaton
We do NOT write `fetch` calls manually.
-   **Source**: Backend `openapi.json`.
-   **Tool**: `openapi-typescript-codegen`.
-   **Result**: `src/client/` contains typed functions.
-   **Example**: `TasksService.readTasks()` returns `Promise<TasksPublicWithProject>`.

### React Query Hooks
We wrap API calls in `useQuery` or `useMutation`.
-   **Read Data**: `useQuery({ queryKey: ['tasks'], queryFn: TasksService.readTasks })`
    -   Handles Caching, Loading, Error states automatically.
-   **Write Data**: `useMutation({ mutationFn: TasksService.createTask })`
    -   **OnSuccess**: `queryClient.invalidateQueries({ queryKey: ['tasks'] })` -> Forces refresh of the list.

### Authentication Hook (`useAuth.ts`)
-   **State**: Stores `access_token` in LocalStorage.
-   **Login**: Calls API, saves token, redirects.
-   **User Data**: Fetches `/users/me` to get profile (is_superuser check).
-   **Logout**: Clears storage, redirects to `/login`.
