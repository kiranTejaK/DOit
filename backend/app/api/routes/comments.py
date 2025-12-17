
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Comment,
    CommentCreate,
    CommentPublic,
    CommentsPublic,
    CommentUpdate,
    Message,
    Project,
    ProjectMember,
    Task,
)

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/", response_model=CommentsPublic)
def read_comments(
    session: SessionDep,
    current_user: CurrentUser,
    task_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve comments for a task. Task ID is required.
    """
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check permissions (must be member of project)
    project = session.get(Project, task.project_id)
    if not current_user.is_superuser:
        if project.owner_id != current_user.id:
            member = session.get(ProjectMember, (project.id, current_user.id))
            if not member and project.is_private:
                raise HTTPException(status_code=400, detail="Not enough permissions")

    statement = select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at)
    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()
    statement = statement.offset(skip).limit(limit)
    comments = session.exec(statement).all()

    return CommentsPublic(data=comments, count=count)


@router.post("/", response_model=CommentPublic)
def create_comment(
    *, session: SessionDep, current_user: CurrentUser, comment_in: CommentCreate
) -> Any:
    """
    Create a new comment.
    """
    task = session.get(Task, comment_in.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check permissions
    project = session.get(Project, task.project_id)
    if not current_user.is_superuser:
        if project.owner_id != current_user.id:
           member = session.get(ProjectMember, (project.id, current_user.id))
           if not member:
               raise HTTPException(status_code=400, detail="Not enough permissions")

    comment = Comment.model_validate(comment_in, update={"user_id": current_user.id})
    session.add(comment)
    session.commit()
    session.refresh(comment)
    
    # TODO: Log activity (Task Commented)
    
    return comment


@router.delete("/{id}", response_model=Message)
def delete_comment(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Delete a comment.
    """
    comment = session.get(Comment, id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    if not current_user.is_superuser and comment.user_id != current_user.id:
         raise HTTPException(status_code=400, detail="Not enough permissions")

    session.delete(comment)
    session.commit()
    return Message(message="Comment deleted successfully")
