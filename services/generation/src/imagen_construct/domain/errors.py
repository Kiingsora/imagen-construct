class ProjectNotFoundError(Exception):
    def __init__(self, project_id: str) -> None:
        super().__init__(f"Project '{project_id}' was not found.")
        self.project_id = project_id


class ProjectStorageError(Exception):
    pass
