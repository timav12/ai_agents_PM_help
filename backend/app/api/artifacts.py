"""Artifacts API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from loguru import logger

from app.database import get_db
from app.models import Artifact, ARTIFACT_TYPES

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


# Schemas
class ArtifactCreate(BaseModel):
    project_id: str
    artifact_type: str
    title: str
    content: str
    created_by_agent: str
    extra_data: Optional[dict] = None


class ArtifactUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    extra_data: Optional[dict] = None


class ArtifactResponse(BaseModel):
    id: str
    project_id: str
    artifact_type: str
    title: str
    content: str
    version: int
    created_by_agent: str
    status: str
    extra_data: Optional[dict]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


@router.get("/types")
async def get_artifact_types():
    """Get all available artifact types."""
    return ARTIFACT_TYPES


@router.get("/project/{project_id}", response_model=List[ArtifactResponse])
async def get_project_artifacts(
    project_id: str,
    artifact_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all artifacts for a project."""
    query = select(Artifact).where(Artifact.project_id == project_id)
    
    if artifact_type:
        query = query.where(Artifact.artifact_type == artifact_type)
    
    # Only get latest versions (no parent_id means it's the latest)
    query = query.where(Artifact.parent_id == None)
    query = query.order_by(Artifact.created_at.desc())
    
    result = await db.execute(query)
    artifacts = result.scalars().all()
    
    return artifacts


@router.get("/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific artifact."""
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    return artifact


@router.get("/{artifact_id}/versions", response_model=List[ArtifactResponse])
async def get_artifact_versions(artifact_id: str, db: AsyncSession = Depends(get_db)):
    """Get all versions of an artifact."""
    # First get the artifact to find the chain
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    # Get all artifacts in the version chain
    versions = [artifact]
    current = artifact
    
    # Go back through parent chain
    while current.parent_id:
        result = await db.execute(select(Artifact).where(Artifact.id == current.parent_id))
        parent = result.scalar_one_or_none()
        if parent:
            versions.append(parent)
            current = parent
        else:
            break
    
    # Reverse to get oldest first
    versions.reverse()
    
    return versions


@router.post("", response_model=ArtifactResponse)
async def create_artifact(
    artifact_data: ArtifactCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new artifact."""
    artifact = Artifact(
        project_id=artifact_data.project_id,
        artifact_type=artifact_data.artifact_type,
        title=artifact_data.title,
        content=artifact_data.content,
        created_by_agent=artifact_data.created_by_agent,
        extra_data=artifact_data.extra_data or {},
    )
    
    db.add(artifact)
    await db.commit()
    await db.refresh(artifact)
    
    logger.info(f"Created artifact: {artifact.title} ({artifact.artifact_type})")
    return artifact


@router.patch("/{artifact_id}", response_model=ArtifactResponse)
async def update_artifact(
    artifact_id: str,
    artifact_data: ArtifactUpdate,
    create_version: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Update an artifact. Optionally create a new version."""
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    if create_version and artifact_data.content:
        # Create new version
        new_artifact = Artifact(
            project_id=artifact.project_id,
            artifact_type=artifact.artifact_type,
            title=artifact_data.title or artifact.title,
            content=artifact_data.content,
            version=artifact.version + 1,
            parent_id=artifact.id,
            created_by_agent=artifact.created_by_agent,
            status=artifact_data.status or "draft",
            extra_data=artifact_data.extra_data or artifact.extra_data,
        )
        db.add(new_artifact)
        await db.commit()
        await db.refresh(new_artifact)
        
        logger.info(f"Created artifact version {new_artifact.version}: {new_artifact.title}")
        return new_artifact
    else:
        # Update in place
        if artifact_data.title:
            artifact.title = artifact_data.title
        if artifact_data.content:
            artifact.content = artifact_data.content
        if artifact_data.status:
            artifact.status = artifact_data.status
        if artifact_data.extra_data:
            artifact.extra_data = artifact_data.extra_data
        
        await db.commit()
        await db.refresh(artifact)
        
        return artifact


@router.delete("/{artifact_id}")
async def delete_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an artifact."""
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    await db.delete(artifact)
    await db.commit()
    
    return {"status": "deleted", "artifact_id": artifact_id}
