"""Project API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from loguru import logger

from app.database import get_db
from app.models import Project, ProjectContext, User
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all projects for the current user."""
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .options(selectinload(Project.context))
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return projects


@router.post("", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project."""
    # Create project
    project = Project(
        user_id=current_user.id,
        name=project_data.name,
        description=project_data.description,
        target_launch_date=project_data.target_launch_date,
        total_budget_usd=project_data.total_budget_usd,
    )
    db.add(project)
    await db.flush()  # Get project ID
    
    # Create context if provided
    if project_data.context:
        context = ProjectContext(
            project_id=project.id,
            business_goal=project_data.context.business_goal,
            target_audience=project_data.context.target_audience,
            arpu_usd=project_data.context.arpu_usd,
            estimated_cac_usd=project_data.context.estimated_cac_usd,
            speed_priority=project_data.context.speed_priority,
            quality_priority=project_data.context.quality_priority,
            cost_priority=project_data.context.cost_priority,
        )
        db.add(context)
    
    await db.commit()
    await db.refresh(project)
    
    # Reload with context
    result = await db.execute(
        select(Project)
        .where(Project.id == project.id)
        .options(selectinload(Project.context))
    )
    project = result.scalar_one()
    
    logger.info(f"Created project: {project.name} ({project.id})")
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific project by ID."""
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id, Project.user_id == current_user.id)
        .options(selectinload(Project.context))
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a project."""
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id, Project.user_id == current_user.id)
        .options(selectinload(Project.context))
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project)
    
    logger.info(f"Updated project: {project.name} ({project.id})")
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(project)
    await db.commit()
    
    logger.info(f"Deleted project: {project_id}")
    return {"status": "deleted", "project_id": project_id}
