"""Admin API endpoints - user management."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel
from loguru import logger

from app.database import get_db
from app.models import User, TokenUsage, Project
from app.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


class UserStats(BaseModel):
    id: str
    email: str
    name: str
    role: Optional[str]
    is_active: bool
    token_limit: int
    tokens_used: int
    projects_count: int
    created_at: str


class UpdateUserLimit(BaseModel):
    token_limit: int


class UpdateUserStatus(BaseModel):
    is_active: bool


def check_admin(user: User):
    """Check if user is admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


@router.get("/users", response_model=List[UserStats])
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users with their stats (admin only)."""
    check_admin(current_user)
    
    # Get all users
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    user_stats = []
    for user in users:
        # Count projects
        proj_result = await db.execute(
            select(func.count(Project.id)).where(Project.user_id == user.id)
        )
        projects_count = proj_result.scalar() or 0
        
        user_stats.append(UserStats(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            is_active=user.is_active if user.is_active is not None else True,
            token_limit=user.token_limit or 25000,
            tokens_used=user.tokens_used or 0,
            projects_count=projects_count,
            created_at=user.created_at.isoformat() if user.created_at else "",
        ))
    
    return user_stats


@router.get("/users/{user_id}", response_model=UserStats)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user's details (admin only)."""
    check_admin(current_user)
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count projects
    proj_result = await db.execute(
        select(func.count(Project.id)).where(Project.user_id == user.id)
    )
    projects_count = proj_result.scalar() or 0
    
    return UserStats(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active if user.is_active is not None else True,
        token_limit=user.token_limit or 25000,
        tokens_used=user.tokens_used or 0,
        projects_count=projects_count,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


@router.patch("/users/{user_id}/limit")
async def update_user_limit(
    user_id: str,
    data: UpdateUserLimit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's token limit (admin only)."""
    check_admin(current_user)
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.token_limit = data.token_limit
    await db.commit()
    
    logger.info(f"Admin {current_user.email} updated token limit for {user.email} to {data.token_limit}")
    
    return {"status": "success", "new_limit": data.token_limit}


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    data: UpdateUserStatus,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enable/disable a user (admin only)."""
    check_admin(current_user)
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot disable yourself")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = data.is_active
    await db.commit()
    
    logger.info(f"Admin {current_user.email} {'enabled' if data.is_active else 'disabled'} user {user.email}")
    
    return {"status": "success", "is_active": data.is_active}


@router.patch("/users/{user_id}/reset-tokens")
async def reset_user_tokens(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reset a user's token usage to 0 (admin only)."""
    check_admin(current_user)
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.tokens_used = 0
    await db.commit()
    
    logger.info(f"Admin {current_user.email} reset tokens for {user.email}")
    
    return {"status": "success", "tokens_used": 0}


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get overall platform stats (admin only)."""
    check_admin(current_user)
    
    # Total users
    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar() or 0
    
    # Total projects
    projects_result = await db.execute(select(func.count(Project.id)))
    total_projects = projects_result.scalar() or 0
    
    # Total tokens used
    tokens_result = await db.execute(select(func.sum(User.tokens_used)))
    total_tokens = tokens_result.scalar() or 0
    
    return {
        "total_users": total_users,
        "total_projects": total_projects,
        "total_tokens_used": total_tokens,
    }
