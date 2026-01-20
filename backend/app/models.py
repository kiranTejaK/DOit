import uuid
from typing import Any, Optional
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    job_title: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=512)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    job_title: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=512)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class WorkspaceMember(SQLModel, table=True):
    workspace_id: uuid.UUID = Field(foreign_key="workspace.id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    role: str = Field(default="member")

class ProjectMember(SQLModel, table=True):
    project_id: uuid.UUID = Field(foreign_key="project.id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    role: str = Field(default="viewer")

class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    workspaces: list["Workspace"] = Relationship(back_populates="members", link_model=WorkspaceMember)
    projects: list["Project"] = Relationship(back_populates="members", link_model=ProjectMember)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    job_title: str | None = None
    avatar_url: str | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int





class WorkspaceBase(SQLModel):
    name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=255)


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(WorkspaceBase):
    name: str | None = Field(default=None, max_length=255)  # type: ignore


class Workspace(WorkspaceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    members: list[User] = Relationship(back_populates="workspaces", link_model=WorkspaceMember)
    projects: list["Project"] = Relationship(back_populates="workspace", cascade_delete=True)


class WorkspacePublic(WorkspaceBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class WorkspacesPublic(SQLModel):
    data: list[WorkspacePublic]
    count: int





class ProjectBase(SQLModel):
    name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=255)
    color: str | None = Field(default="#000000", max_length=7)
    icon: str | None = Field(default=None, max_length=50)
    is_private: bool = Field(default=False)


class ProjectCreate(ProjectBase):
    workspace_id: uuid.UUID


class ProjectUpdate(ProjectBase):
    name: str | None = Field(default=None, max_length=255) # type: ignore
    is_private: bool | None = Field(default=None) # type: ignore


class Project(ProjectBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workspace_id: uuid.UUID = Field(foreign_key="workspace.id", nullable=False)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    workspace: Workspace = Relationship(back_populates="projects")
    members: list[User] = Relationship(back_populates="projects", link_model=ProjectMember)
    tasks: list["Task"] = Relationship(back_populates="project", cascade_delete=True)
    sections: list["Section"] = Relationship(back_populates="project", cascade_delete=True)


class ProjectPublic(ProjectBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    owner_id: uuid.UUID


class ProjectPublicWithWorkspace(ProjectPublic):
    workspace_name: str


class ProjectsPublic(SQLModel):
    data: list[ProjectPublicWithWorkspace]
    count: int


class SectionBase(SQLModel):
    title: str = Field(max_length=255)
    order: float = Field(default=0.0) # For ordering columns


class SectionCreate(SectionBase):
    project_id: uuid.UUID


class SectionUpdate(SectionBase):
    title: str | None = Field(default=None, max_length=255) # type: ignore
    order: float | None = Field(default=None) # type: ignore


class Section(SectionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False)
    
    project: Project = Relationship(back_populates="sections")
    tasks: list["Task"] = Relationship(back_populates="section")


class SectionPublic(SectionBase):
    id: uuid.UUID
    project_id: uuid.UUID


class SectionsPublic(SQLModel):
    data: list[SectionPublic]
    count: int


class TaskBase(SQLModel):
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=255)
    status: str = Field(default="todo") # todo, in_progress, done
    priority: str = Field(default="medium") # low, medium, high
    due_date: str | None = Field(default=None) # ISO string YYYY-MM-DD


class TaskCreate(TaskBase):
    project_id: uuid.UUID
    section_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None


class TaskUpdate(TaskBase):
    title: str | None = Field(default=None, max_length=255) # type: ignore
    status: str | None = Field(default=None) # type: ignore
    priority: str | None = Field(default=None) # type: ignore
    section_id: uuid.UUID | None = Field(default=None) # type: ignore


class Task(TaskBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False)
    section_id: uuid.UUID | None = Field(foreign_key="section.id", default=None, nullable=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    assignee_id: uuid.UUID | None = Field(foreign_key="user.id", default=None, nullable=True)

    project: Project = Relationship(back_populates="tasks")
    section: Section | None = Relationship(back_populates="tasks")
    comments: list["Comment"] = Relationship(back_populates="task", cascade_delete=True)
    activity_logs: list["ActivityLog"] = Relationship(back_populates="task", cascade_delete=True)
    attachments: list["Attachment"] = Relationship(back_populates="task", cascade_delete=True)

    # Optional relationships to owner and assignee
    # owner: User = Relationship(sa_relationship_kwargs={"foreign_keys": "Task.owner_id"})
    # assignee: User = Relationship(sa_relationship_kwargs={"foreign_keys": "Task.assignee_id"})


class TaskPublic(TaskBase):
    id: uuid.UUID
    project_id: uuid.UUID
    section_id: uuid.UUID | None
    owner_id: uuid.UUID
    assignee_id: uuid.UUID | None


class TasksPublic(SQLModel):
    data: list[TaskPublic]
    count: int


class CommentBase(SQLModel):
    content: str


class CommentCreate(CommentBase):
    task_id: uuid.UUID
    attachment_ids: list[uuid.UUID] | None = None


class CommentUpdate(CommentBase):
    content: str | None = Field(default=None) # type: ignore


class Comment(CommentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="task.id", nullable=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    task: Task = Relationship(back_populates="comments")
    attachments: list["Attachment"] = Relationship(back_populates="comment", cascade_delete=True)
    # user: User = Relationship(sa_relationship_kwargs={"foreign_keys": "Comment.user_id"})


class CommentPublic(CommentBase):
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    user_full_name: str | None = None


class CommentsPublic(SQLModel):
    data: list[CommentPublic]
    count: int


class ActivityLogBase(SQLModel):
    action: str  # e.g., "created", "updated_status", "commented"
    details: str | None = None # e.g., "changed status from todo to in_progress"

class ActivityLog(ActivityLogBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="task.id", nullable=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    task: Task = Relationship(back_populates="activity_logs")
    # user: User = Relationship(sa_relationship_kwargs={"foreign_keys": "ActivityLog.user_id"})

class ActivityLogPublic(ActivityLogBase):
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

class ActivityLogsPublic(SQLModel):
    data: list[ActivityLogPublic]
    count: int


class AttachmentBase(SQLModel):
    file_name: str
    file_path: str
    file_type: str
    file_size: int

class Attachment(AttachmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="task.id", nullable=False)
    comment_id: uuid.UUID | None = Field(foreign_key="comment.id", default=None, nullable=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    task: Task = Relationship(back_populates="attachments")
    comment: "Comment" = Relationship(back_populates="attachments")

class AttachmentPublic(AttachmentBase):
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    comment_id: uuid.UUID | None = None
    created_at: datetime


class InvitationBase(SQLModel):
    email: EmailStr = Field(max_length=255, index=True)
    role: str = Field(default="member")
    status: str = Field(default="pending") # pending, accepted, expired


class InvitationCreate(InvitationBase):
    workspace_id: uuid.UUID


class Invitation(InvitationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    token: str = Field(unique=True, index=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    workspace_id: uuid.UUID = Field(foreign_key="workspace.id", nullable=False)
    inviter_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    workspace: Workspace = Relationship()
    inviter: User = Relationship()


class InvitationPublic(InvitationBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    inviter_id: uuid.UUID
    expires_at: datetime
    created_at: datetime


class AttachmentsPublic(SQLModel):
    data: list[AttachmentPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None



class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmail(SQLModel):
    token: str

# Extended Public Models for UI

class WorkspaceMemberPublic(UserPublic):
    role: str

class WorkspaceMembersPublic(SQLModel):
    data: list[WorkspaceMemberPublic]
    count: int

class TaskPublicWithProject(TaskPublic):
    project_name: str
    project_color: str | None = None

class TasksPublicWithProject(SQLModel):
    data: list[TaskPublicWithProject]
    count: int
