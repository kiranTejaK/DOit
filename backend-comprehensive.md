# Backend Documentation & Flow Analysis

This document details **every single API endpoint** found in the codebase (`app/api/routes/*.py`) involving Functionality, Data Flow, Logic, and ORM Interactions.

---

## 🔐 Authentication (`login.py`)

### **1. POST /api/v1/login/access-token**
**Functionality**: Authenticates a user and returns an OAuth2 access token.
**Data Flow and Logic**:
*   **Request Payload**: `OAuth2PasswordRequestForm` (username, password).
*   **Core Logic**:
    1.  Calls `crud.authenticate(session, email, password)`.
    2.  Fetches user from DB. Verifies password hash using `verify_password`.
    3.  If valid, generates JWT using `security.create_access_token` with expiration.
*   **ORM Interaction**: `session.exec(select(User).where(User.email == email))` via `crud.get_user_by_email`.
*   **Response Structure**: `Token` schema (`access_token`, `token_type`).
**File Location**: `backend/app/api/routes/login.py`

### **2. POST /api/v1/login/test-token**
**Functionality**: Verifies the validity of an access token and returns the current user.
**Data Flow and Logic**:
*   **Request Payload**: None (Authorization Header required).
*   **Core Logic**: Dependency `CurrentUser` decodes JWT, validates signature, and fetches the user.
*   **ORM Interaction**: Implicitly calls `session.get(User, user_id)` in dependency.
*   **Response Structure**: `UserPublic` model.
**File Location**: `backend/app/api/routes/login.py`

### **3. POST /api/v1/login/password-recovery/{email}**
**Functionality**: Sends a password recovery email to the registered address.
**Data Flow and Logic**:
*   **Request Payload**: `email` (Path Parameter).
*   **Core Logic**: Checks if user exists. Generates a temporary reset token. Sends email via SMTP.
*   **ORM Interaction**: `session.exec(select(User).where(User.email == email))`.
*   **Response Structure**: `Message` (Generic success message).
**File Location**: `backend/app/api/routes/login.py`

### **4. POST /api/v1/login/reset-password/**
**Functionality**: Resets password using a valid token.
**Data Flow and Logic**:
*   **Request Payload**: `NewPassword` (token, new_password).
*   **Core Logic**: Verifies token validity. Hashes new password. Updates User record.
*   **ORM Interaction**: `session.get(User, user_id)`, `session.add(user)`, `session.commit()`.
*   **Response Structure**: `Message`.
**File Location**: `backend/app/api/routes/login.py`

### **5. POST /api/v1/login/password-recovery-html-content/{email}**
**Functionality**: (Debug/Admin) Returns HTML content of recovery email without sending.
**Data Flow and Logic**:
*   **Request Payload**: `email` (Path Parameter).
*   **Core Logic**: Generates email HTML via `generate_reset_password_email` but returns it as string.
*   **Response Structure**: `HTMLResponse`.
**File Location**: `backend/app/api/routes/login.py`

---

## 👥 Users (`users.py`)

### **6. GET /api/v1/users/**
**Functionality**: Lists all users (Superuser only).
**Data Flow and Logic**:
*   **Request Payload**: Query Params (`skip`, `limit`).
*   **Core Logic**: Checks `current_user.is_superuser`. Fetches paginated list.
*   **ORM Interaction**: `session.exec(select(User).offset(skip).limit(limit))`.
*   **Response Structure**: `UsersPublic`.
**File Location**: `backend/app/api/routes/users.py`

### **7. POST /api/v1/users/**
**Functionality**: Creates a new user (Superuser only).
**Data Flow and Logic**:
*   **Request Payload**: `UserCreate`.
*   **Core Logic**: Checks email uniqueness. Hashes password. Sends welcome email.
*   **ORM Interaction**: `session.add(user)`, `session.commit()`.
*   **Response Structure**: `UserPublic`.
**File Location**: `backend/app/api/routes/users.py`

### **8. GET /api/v1/users/me**
**Functionality**: Get current user profile.
**Data Flow and Logic**:
*   **Core Logic**: Returns `current_user` dependency.
*   **Response Structure**: `UserPublic`.
**File Location**: `backend/app/api/routes/users.py`

### **9. PATCH /api/v1/users/me**
**Functionality**: Update current user profile.
**Data Flow and Logic**:
*   **Request Payload**: `UserUpdateMe`.
*   **Core Logic**: Updates Allowed fields.
*   **ORM Interaction**: `current_user.sqlmodel_update(data)`, `session.add()`, `session.commit()`.
*   **Response Structure**: `UserPublic`.
**File Location**: `backend/app/api/routes/users.py`

### **10. PATCH /api/v1/users/me/password**
**Functionality**: Update own password.
**Data Flow and Logic**:
*   **Request Payload**: `UpdatePassword` (current_password, new_password).
*   **Core Logic**: Verifies old password. Hashes new one.
*   **ORM Interaction**: `session.add(user)`, `session.commit()`.
**File Location**: `backend/app/api/routes/users.py`

### **11. DELETE /api/v1/users/me**
**Functionality**: Delete own account.
**Data Flow and Logic**:
*   **Core Logic**: Prevents Superuser self-deletion.
*   **ORM Interaction**: `session.delete(current_user)`, `session.commit()`.
**File Location**: `backend/app/api/routes/users.py`

### **12. POST /api/v1/users/signup**
**Functionality**: Public registration.
**Data Flow and Logic**:
*   **Request Payload**: `UserRegister`.
*   **Core Logic**: Checks email availability. Creates user.
*   **ORM Interaction**: `crud.create_user(session, user_create)`.
*   **Response Structure**: `UserPublic`.
**File Location**: `backend/app/api/routes/users.py`

### **13. GET /api/v1/users/{user_id}**
**Functionality**: Get user details.
**Data Flow and Logic**:
*   **Core Logic**: Allows if Superuser OR if accessing own ID.
*   **ORM Interaction**: `session.get(User, user_id)`.
**File Location**: `backend/app/api/routes/users.py`

### **14. PATCH /api/v1/users/{user_id}**
**Functionality**: Update specific user (Superuser only).
**Data Flow and Logic**:
*   **Core Logic**: Updates any user field.
*   **ORM Interaction**: `crud.update_user(...)`.
**File Location**: `backend/app/api/routes/users.py`

### **15. DELETE /api/v1/users/{user_id}**
**Functionality**: Delete specific user (Superuser only).
**Data Flow and Logic**:
*   **Core Logic**: Deletes user and associated Items.
*   **ORM Interaction**: `session.delete(user)`.
**File Location**: `backend/app/api/routes/users.py`

---

## 📂 Workspaces (`workspaces.py`)

### **16. GET /api/v1/workspaces/**
**Functionality**: List workspaces user is member of.
**Data Flow and Logic**:
*   **ORM Interaction**: `select(Workspace).join(WorkspaceMember).where(WorkspaceMember.user_id == current_user.id)`.
**File Location**: `backend/app/api/routes/workspaces.py`

### **17. POST /api/v1/workspaces/**
**Functionality**: Create workspace.
**Data Flow and Logic**:
*   **Core Logic**: Creates workspace + Adds Creator as Owner.
*   **ORM Interaction**: `session.add(workspace)`, `session.add(WorkspaceMember(..., role="owner"))`.
**File Location**: `backend/app/api/routes/workspaces.py`

### **18. GET /api/v1/workspaces/{id}**
**Functionality**: Get workspace details.
**Data Flow and Logic**:
*   **Core Logic**: Verifies membership.
*   **ORM Interaction**: `session.get(Workspace, id)`.
**File Location**: `backend/app/api/routes/workspaces.py`

### **19. PUT /api/v1/workspaces/{id}**
**Functionality**: Update workspace.
**Data Flow and Logic**:
*   **Core Logic**: Verifies user is Owner.
*   **ORM Interaction**: `workspace.sqlmodel_update(data)`.
**File Location**: `backend/app/api/routes/workspaces.py`

### **20. DELETE /api/v1/workspaces/{id}**
**Functionality**: Delete workspace.
**Data Flow and Logic**:
*   **Core Logic**: Verifies user is Owner.
*   **ORM Interaction**: `session.delete(workspace)`.
**File Location**: `backend/app/api/routes/workspaces.py`

### **21. GET /api/v1/workspaces/{id}/members**
**Functionality**: List members of workspace.
**Data Flow and Logic**:
*   **ORM Interaction**: `session.exec(select(User, WorkspaceMember).join(...))`.
*   **Response Structure**: `WorkspaceMembersPublic` (Includes roles).
**File Location**: `backend/app/api/routes/workspaces.py`

---

## 🚀 Projects (`projects.py`)

### **22. GET /api/v1/projects/**
**Functionality**: List projects.
**Data Flow and Logic**:
*   **Core Logic**: Returns projects where user is member/owner.
*   **ORM Interaction**: `select(Project).join(ProjectMember)`.
**File Location**: `backend/app/api/routes/projects.py`

### **23. POST /api/v1/projects/**
**Functionality**: Create project.
**Data Flow and Logic**:
*   **Core Logic**: Verifies Workspace membership. Creates Project. Adds user as Project Owner.
*   **ORM Interaction**: `session.add(project)`, `session.add(ProjectMember)`.
**File Location**: `backend/app/api/routes/projects.py`

### **24. GET /api/v1/projects/{id}**
**Functionality**: Get project details.
**Data Flow and Logic**:
*   **Core Logic**: Verifies Project membership.
*   **ORM Interaction**: `session.get(Project, id)`.
**File Location**: `backend/app/api/routes/projects.py`

### **25. PUT /api/v1/projects/{id}**
**Functionality**: Update project.
**Data Flow and Logic**:
*   **Core Logic**: Checks permissions (Owner).
*   **ORM Interaction**: `project.sqlmodel_update()`.
**File Location**: `backend/app/api/routes/projects.py`

### **26. DELETE /api/v1/projects/{id}**
**Functionality**: Delete project.
**Data Flow and Logic**:
*   **Core Logic**: Checks permissions.
*   **ORM Interaction**: `session.delete(project)`.
**File Location**: `backend/app/api/routes/projects.py`

---

## ✅ Tasks (`tasks.py`)

### **27. GET /api/v1/tasks/**
**Functionality**: List tasks (supports filtering).
**Data Flow and Logic**:
*   **ORM Interaction**: `select(Task, Project).join(Project)`. Fetches Project info eagerly.
**File Location**: `backend/app/api/routes/tasks.py`

### **28. POST /api/v1/tasks/**
**Functionality**: Create task.
**Data Flow and Logic**:
*   **Core Logic**: Verifies Project membership.
*   **ORM Interaction**: `session.add(task)`.
**File Location**: `backend/app/api/routes/tasks.py`

### **29. GET /api/v1/tasks/{id}**
**Functionality**: Get task details.
**Data Flow and Logic**:
*   **ORM Interaction**: `session.get(Task, id)`.
**File Location**: `backend/app/api/routes/tasks.py`

### **30. PUT /api/v1/tasks/{id}**
**Functionality**: Update task.
**Data Flow and Logic**:
*   **Core Logic**: Updates status, priority, etc.
*   **ORM Interaction**: `task.sqlmodel_update()`.
**File Location**: `backend/app/api/routes/tasks.py`

### **31. DELETE /api/v1/tasks/{id}**
**Functionality**: Delete task.
**Data Flow and Logic**:
*   **ORM Interaction**: `session.delete(task)`.
**File Location**: `backend/app/api/routes/tasks.py`

---

## 📑 Sections (`sections.py`)

### **32. GET /api/v1/sections/**
**Functionality**: List sections for a project.
**Data Flow and Logic**:
*   **Request Payload**: `project_id` (Query).
*   **Core Logic**: Verifies project membership.
*   **ORM Interaction**: `session.exec(select(Section).where(Section.project_id == project_id).order_by(Section.order))`.
*   **Response Structure**: `SectionsPublic`.
**File Location**: `backend/app/api/routes/sections.py`

### **33. POST /api/v1/sections/**
**Functionality**: Create new section.
**Data Flow and Logic**:
*   **Request Payload**: `SectionCreate` (title, project_id, order).
*   **Core Logic**: Verifies project membership.
*   **ORM Interaction**: `session.add(section)`, `session.commit()`.
*   **Response Structure**: `SectionPublic`.
**File Location**: `backend/app/api/routes/sections.py`

### **34. PUT /api/v1/sections/{id}**
**Functionality**: Update section (Title or Order).
**Data Flow and Logic**:
*   **Request Payload**: `SectionUpdate`.
*   **Core Logic**: Verifies permissions.
*   **ORM Interaction**: `section.sqlmodel_update(update_dict)`, `session.commit()`.
*   **Response Structure**: `SectionPublic`.
**File Location**: `backend/app/api/routes/sections.py`

### **35. DELETE /api/v1/sections/{id}**
**Functionality**: Delete section.
**Data Flow and Logic**:
*   **Core Logic**: Verifies permissions.
*   **ORM Interaction**: `session.delete(section)`, `session.commit()`.
*   **Response Structure**: `Message`.
**File Location**: `backend/app/api/routes/sections.py`

---

## 📎 Attachments (`attachments.py`)

### **36. GET /api/v1/attachments/**
**Functionality**: List attachments for a task.
**Data Flow and Logic**:
*   **Request Payload**: `task_id` (Query).
*   **ORM Interaction**: `select(Attachment).where(Attachment.task_id == task_id)`.
*   **Response Structure**: `AttachmentsPublic`.
**File Location**: `backend/app/api/routes/attachments.py`

### **37. POST /api/v1/attachments/**
**Functionality**: Upload attachment.
**Data Flow and Logic**:
*   **Request Payload**: `file` (Multipart), `task_id`.
*   **Core Logic**: Uploads to S3 or Local `uploads/`. Creates DB record.
*   **ORM Interaction**: `session.add(attachment)`.
*   **Response Structure**: `AttachmentPublic`.
**File Location**: `backend/app/api/routes/attachments.py`

### **38. DELETE /api/v1/attachments/{id}**
**Functionality**: Delete attachment.
**Data Flow and Logic**:
*   **Core Logic**: Deletes file from S3/Local. Deletes DB record.
*   **ORM Interaction**: `session.delete(attachment)`.
**File Location**: `backend/app/api/routes/attachments.py`

### **39. GET /api/v1/attachments/{id}/url**
**Functionality**: Get download URL.
**Data Flow and Logic**:
*   **Core Logic**: Generates Presigned URL (if S3).
*   **Response Structure**: `Message` (containing URL).
**File Location**: `backend/app/api/routes/attachments.py`

---

## 💬 Comments (`comments.py`)

### **40. GET /api/v1/comments/**
**Functionality**: List comments for a task.
**Data Flow and Logic**:
*   **Request Payload**: `task_id`.
*   **ORM Interaction**: `select(Comment).where(Comment.task_id == task_id)`.
*   **Response Structure**: `CommentsPublic`.
**File Location**: `backend/app/api/routes/comments.py`

### **41. POST /api/v1/comments/**
**Functionality**: Create comment.
**Data Flow and Logic**:
*   **Request Payload**: `CommentCreate` (content, task_id).
*   **ORM Interaction**: `session.add(comment)`.
**File Location**: `backend/app/api/routes/comments.py`

### **42. DELETE /api/v1/comments/{id}**
**Functionality**: Delete comment.
**Data Flow and Logic**:
*   **Core Logic**: Verifies User is comment author (or Superuser).
*   **ORM Interaction**: `session.delete(comment)`.
**File Location**: `backend/app/api/routes/comments.py`

---

## 📩 Invitations (`invitations.py`)

### **43. POST /api/v1/invitations/**
**Functionality**: Send invitation email.
**Data Flow and Logic**:
*   **Request Payload**: `email`, `workspace_id`, `role`.
*   **Core Logic**: Generates token. Sends email.
*   **Response Structure**: `InvitationPublic` (or Message).
**File Location**: `backend/app/api/routes/invitations.py`

### **44. GET /api/v1/invitations/{token}**
**Functionality**: Read invitation details.
**Data Flow and Logic**:
*   **Logic**: Decodes token. Returns payload (workspace_id, email).
**File Location**: `backend/app/api/routes/invitations.py`

### **45. POST /api/v1/invitations/accept**
**Functionality**: Accept invitation.
**Data Flow and Logic**:
*   **Core Logic**: Decodes token. Adds user to `WorkspaceMember` table.
*   **ORM Interaction**: `session.add(WorkspaceMember)`.
**File Location**: `backend/app/api/routes/invitations.py`

---

## 📦 Utilities (`utils.py` & `private.py`)

### **46. POST /api/v1/utils/test-email/**
**Functionality**: Test email sending.
**Data Flow and Logic**:
*   **Request Payload**: `email_to` (EmailStr).
*   **Core Logic**: Calls `utils.send_email`. Logic is mostly SMTP interaction.
*   **Response Structure**: `Message`.
**File Location**: `backend/app/api/routes/utils.py`

### **47. GET /api/v1/utils/health-check/**
**Functionality**: Health check for Docker/K8s.
**Data Flow and Logic**:
*   **Logic**: Returns `True`. No DB interaction.
*   **Response Structure**: `bool`.
**File Location**: `backend/app/api/routes/utils.py`

### **48. POST /api/v1/private/users/**
**Functionality**: Internal/Private user creation (for seeding/testing).
**Data Flow and Logic**:
*   **Request Payload**: `PrivateUserCreate`.
*   **Core Logic**: Creates user directly without email checks/sending.
*   **ORM Interaction**: `session.add(user)`.
**File Location**: `backend/app/api/routes/private.py`

---

## 📦 Items (`items.py`) - *Legacy/Template*

### **49. GET /api/v1/items/**
**Functionality**: List items (Template).
**Data Flow and Logic**:
*   **ORM Interaction**: `select(Item).where(Item.owner_id == user.id)`.
**File Location**: `backend/app/api/routes/items.py`

### **50. POST /api/v1/items/**
**Functionality**: Create item (Template).
**Data Flow and Logic**:
*   **ORM Interaction**: `session.add(item)`.
**File Location**: `backend/app/api/routes/items.py`

### **51. GET /api/v1/items/{id}**
**Functionality**: Get item (Template).
**File**: `backend/app/api/routes/items.py`

### **52. PUT /api/v1/items/{id}**
**Functionality**: Update item (Template).
**File**: `backend/app/api/routes/items.py`

### **53. DELETE /api/v1/items/{id}**
**Functionality**: Delete item (Template).
**File**: `backend/app/api/routes/items.py`
