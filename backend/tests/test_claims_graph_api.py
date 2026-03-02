import io
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import BackgroundTasks, UploadFile

import claims_graph_api


class DummyDB:
    def __init__(self):
        self.added = []
        self.committed = False

    def add(self, obj):
        self.added.append(obj)
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(timezone.utc)

    async def commit(self):
        self.committed = True


@pytest.mark.asyncio
async def test_upload_paper_generates_valid_upload_id(tmp_path, monkeypatch):
    monkeypatch.setattr(claims_graph_api, "STORAGE_DIR", tmp_path)
    db = DummyDB()

    response = await claims_graph_api.upload_paper(
        background_tasks=BackgroundTasks(),
        project_id="project-1",
        file=UploadFile(filename="paper.pdf", file=io.BytesIO(b"%PDF-1.4 test")),
        db=db,
        current_user=SimpleNamespace(id="user-1"),
    )

    assert str(UUID(response.id)) == response.id
    assert db.committed
    assert len(db.added) == 1
    assert response.filename == "paper.pdf"
    assert (tmp_path / f"{response.id}.pdf").exists()
