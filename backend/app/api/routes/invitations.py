import structlog
from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, delete, func, select

from app import crud
from app.api import deps
from app.core.config import settings
from app.models import (
    Invitation,
    InvitationCreate,
    InvitationPublic,
    Message,
    User,
    Workspace,
    WorkspaceMember,
)
from app.utils import send_email

router = APIRouter()
logger = structlog.get_logger()

@router.post("/", response_model=InvitationPublic)
def create_invitation(
    *,
    session: deps.SessionDep,
    current_user: deps.CurrentUser,
    invitation_in: InvitationCreate,
) -> Any:
    """
    Create an invitation for a user to join a workspace.
    """
    # Check if workspace exists
    workspace = session.get(Workspace, invitation_in.workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check permission (inviter must be a member of the workspace)
    member = session.exec(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == invitation_in.workspace_id)
        .where(WorkspaceMember.user_id == current_user.id)
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if user is already a member
    # Find user by email
    user_by_email = session.exec(select(User).where(User.email == invitation_in.email)).first()
    if user_by_email:
        existing_member = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == invitation_in.workspace_id)
            .where(WorkspaceMember.user_id == user_by_email.id)
        ).first()
        if existing_member:
            raise HTTPException(status_code=400, detail="User is already a member of this workspace")

    # Check if pending invitation exists
    existing_invitation = session.exec(
        select(Invitation)
        .where(Invitation.workspace_id == invitation_in.workspace_id)
        .where(Invitation.email == invitation_in.email)
        .where(Invitation.status == "pending")
    ).first()
    
    if existing_invitation:
        # Check if expired, if so, delete it or re-send?
        if existing_invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
             session.delete(existing_invitation)
             session.commit()
        else:
             raise HTTPException(status_code=400, detail="Invitation already sent")

    # Create invitation
    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7) # 7 days expiry
    
    invitation = Invitation.model_validate(
        invitation_in, 
        update={
            "token": token, 
            "expires_at": expires_at,
            "inviter_id": current_user.id
        }
    )
    session.add(invitation)
    session.commit()
    session.refresh(invitation)

    # Send email
    if settings.emails_enabled:
        invite_link = f"{settings.FRONTEND_HOST}/accept-invite?token={token}"
        email_content = f"""
        You have been invited to join the workspace <b>{workspace.name}</b> on DOit.<br/><br/>
        Click the link below to accept the invitation:<br/>
        <a href="{invite_link}">{invite_link}</a><br/><br/>
        This link will expire in 7 days.
        """
        send_email(
            email_to=invitation.email,
            subject=f"Invitation to join {workspace.name} on DOit",
            html_content=email_content
        )

    return invitation


@router.get("/{token}", response_model=InvitationPublic)
def get_invitation(
    *,
    session: deps.SessionDep,
    token: str,
) -> Any:
    """
    Get invitation details by token.
    """
    invitation = session.exec(select(Invitation).where(Invitation.token == token)).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation expired")
        
    if invitation.status != "pending":
         raise HTTPException(status_code=400, detail="Invitation already accepted or invalid")

    return invitation


@router.post("/accept", response_model=Message)
def accept_invitation(
    *,
    session: deps.SessionDep,
    current_user: deps.CurrentUser,
    token: str,
) -> Any:
    """
    Accept an invitation.
    """
    invitation = session.exec(select(Invitation).where(Invitation.token == token)).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation expired")
        
    if invitation.status != "pending":
         raise HTTPException(status_code=400, detail="Invitation already accepted")
         
    # Update invitation status
    invitation.status = "accepted"
    session.add(invitation)
    
    # Add user to workspace
    # Check if already member (double check)
    existing_member = session.exec(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == invitation.workspace_id)
        .where(WorkspaceMember.user_id == current_user.id)
    ).first()
    
    if not existing_member:
        member = WorkspaceMember(
            workspace_id=invitation.workspace_id,
            user_id=current_user.id,
            role=invitation.role
        )
        session.add(member)
    
    session.commit()
    
    return Message(message="Invitation accepted successfully")
