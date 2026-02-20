from fastapi import HTTPException, status


class DocumentNotFoundError(HTTPException):
    def __init__(self, document_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )


class UnsupportedFileTypeError(HTTPException):
    def __init__(self, filename: str, supported: list[str]):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type for '{filename}'. Supported: {', '.join(supported)}",
        )


class FileTooLargeError(HTTPException):
    def __init__(self, max_mb: int):
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {max_mb}MB",
        )


class DocumentProcessingError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {detail}",
        )


class NoDocumentsError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents in the knowledge base. Upload documents first.",
        )


class LLMProviderError(HTTPException):
    def __init__(self, provider: str, detail: str):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM provider '{provider}' error: {detail}",
        )
