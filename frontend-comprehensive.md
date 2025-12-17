# Frontend Documentation & Component Reference

This document details core functional areas following the specified format: Component Name, Purpose, Key Methods, State Management, and File Location.

---

## 📋 Task Management

### **1. Task Management ("My Tasks" View)**
**Component Name**: `MyTasks` (via `Route` component)
**Purpose**: Displays a table of all tasks assigned to the current user, showing status, priority, and project context.
**Key Methods/Functions**:
*   `onClick()` (Row): Sets the `selectedTask` state to open the details drawer.
*   `useAuth()`: Retrieves current user ID to filter tasks.
**State Management/Data Flow**:
*   **TanStack Query**: `useQuery({ queryKey: ["tasks", { assigneeId: user.id }], queryFn: () => TasksService.readTasks(...) })`.
*   **Data Usage**: Maps over `tasks` array to render `Table.Row` elements.
*   **Component Interactions**:
    *   Renders `AddTask` (Modal) for creating tasks.
    *   Renders `TaskDetails` (Drawer) when a row is clicked (controlled via `selectedTask` state).
**File Location**: `frontend/src/routes/_layout/tasks.tsx`

### **2. Add Task Modal**
**Component Name**: `AddTask`
**Purpose**: A modal dialog providing a form to create a new task.
**Key Methods/Functions**:
*   `useForm<TaskCreate>()`: Manages form state (Title, Project, Status).
*   `onSubmit`: Handles form submission.
**State Management/Data Flow**:
*   **TanStack Query**:
    *   `useMutation({ mutationFn: TasksService.createTask })`.
    *   **Optimization**: Invalidate query `['tasks']` on success to auto-refresh the list.
*   **Component Interactions**:
    *   Dependent Query: Fetches `WorkspacesService.readWorkspaceMembers` only when a Project is selected in the dropdown.
**File Location**: `frontend/src/components/Tasks/AddTask.tsx`

### **3. Task Details Drawer**
**Component Name**: `TaskDetails`
**Purpose**: A slide-out drawer showing deep details (Description, Comments, Attachments).
**Key Methods/Functions**:
*   `onOpenChange`: Handles closing the drawer.
**State Management/Data Flow**:
*   **TanStack Query**:
    *   `useQuery(['comments', taskId])`: Fetches conversation history.
    *   `useQuery(['attachments', taskId])`: Fetches files.
*   **Component Interactions**:
    *   Contains `Comments` component (list + input).
    *   Contains `AttachmentList` component.
**File Location**: `frontend/src/components/Tasks/TaskDetails.tsx`

---

## 🏗️ Project Board (Kanban)

### **4. Kanban Board**
**Component Name**: `KanbanBoard`
**Purpose**: Renders columns (Todo, Doing, Done) and handles drag-and-drop logic for tasks.
**Key Methods/Functions**:
*   `handleDragEnd(event)`: Calculates the new position and column of the dropped task. Triggers API update.
*   `onTaskMove`: Callback prop called when a drop is successful.
**State Management/Data Flow**:
*   **Local State**: `useState<items>` tracks the *optimistic* position of tasks before the API confirms.
*   **Component Interactions**:
    *   Uses `dnd-kit` (`DndContext`, `DragOverlay`).
    *   Renders `KanbanColumn` for each status.
**File Location**: `frontend/src/components/Projects/KanbanBoard.tsx`

### **5. Kanban Project View**
**Component Name**: `ProjectDetails` (in `projects.$projectId.tsx`)
**Purpose**: The wrapper page for a project. Fetches tasks and renders the board.
**Key Methods/Functions**:
*   `onTaskMove`: updates task via `TasksService.updateTask`.
**State Management/Data Flow**:
*   **TanStack Query**: `useQuery(['tasks', { projectId }])`.
*   **Mutation**: `useMutation(updateTask)`.
    *   **Optimistic UI**: The `KanbanBoard` updates UI immediately. If API fails, query invalidation reverts it.
**File Location**: `frontend/src/routes/_layout/projects.$projectId.tsx`

---

## 🧩 Common/Layout

### **6. Sidebar Navigation**
**Component Name**: `Sidebar`
**Purpose**: Persistent left navigation menu.
**Key Methods/Functions**:
*   `useAuth()`: Checks `user.is_superuser` to verify if Admin links should be shown.
**State Management/Data Flow**:
*   **Component Interactions**: Renders `SidebarItems` based on a configuration array.
**File Location**: `frontend/src/components/Common/Sidebar.tsx`
