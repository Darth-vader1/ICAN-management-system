"""
H6 – Content-type validation for file uploads using python-magic.

Validates that the *actual* file content (magic bytes) matches the
declared file extension, preventing disguised executables or scripts.

Usage
-----
    from config.file_validators import validate_image_upload, validate_document_upload

    # In a view:
    validate_image_upload(file_obj)          # raises ValidationError on mismatch

    # In a serializer field:
    file = ValidatedFileField(
        allowed_mime_prefixes=["application/pdf", "image/"],
        allowed_extensions=[".pdf", ".jpg", ".png"],
        max_size_mb=20,
    )
"""

from __future__ import annotations

import logging
import os
from typing import Iterable

from django.core.exceptions import ValidationError
from rest_framework import serializers

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# python-magic with graceful fallback
# ---------------------------------------------------------------------------
try:
    import magic  # python-magic  (uses libmagic)

    def _detect_mime(file_obj) -> str:
        """Read the first 2 KiB to detect MIME via libmagic."""
        file_obj.seek(0)
        header = file_obj.read(2048)
        file_obj.seek(0)
        return magic.from_buffer(header, mime=True)

except ImportError:
    logger.warning(
        "python-magic is not installed – falling back to extension-only "
        "validation. Install python-magic for content-type sniffing."
    )

    import mimetypes

    def _detect_mime(file_obj) -> str:  # type: ignore[misc]
        """Fallback: guess from filename (no magic-byte check)."""
        mime, _ = mimetypes.guess_type(file_obj.name or "")
        return mime or "application/octet-stream"


# ---------------------------------------------------------------------------
# MIME allow-lists
# ---------------------------------------------------------------------------
IMAGE_MIMES = frozenset({
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
})

IMAGE_EXTENSIONS = frozenset({
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp",
})

DOCUMENT_MIMES = frozenset({
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    # Allow images as classroom materials too
    *IMAGE_MIMES,
})

DOCUMENT_EXTENSIONS = frozenset({
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".csv",
    *IMAGE_EXTENSIONS,
})

# ---------------------------------------------------------------------------
# Core validator
# ---------------------------------------------------------------------------

def _validate_upload(
    file_obj,
    *,
    allowed_mimes: frozenset[str],
    allowed_extensions: frozenset[str],
    max_size_bytes: int,
    label: str = "file",
) -> None:
    """
    Validate an uploaded file's real content type, extension, and size.

    Raises ``django.core.exceptions.ValidationError`` on failure.
    """
    if file_obj is None:
        raise ValidationError(f"No {label} provided.")

    # 1) Size ------------------------------------------------------------------
    if file_obj.size > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        raise ValidationError(
            f"{label.capitalize()} exceeds the maximum size of {max_mb:.0f} MB."
        )

    # 2) Extension -------------------------------------------------------------
    ext = os.path.splitext(file_obj.name or "")[1].lower()
    if ext not in allowed_extensions:
        nice = ", ".join(sorted(allowed_extensions))
        raise ValidationError(
            f"Extension '{ext}' is not allowed. Accepted: {nice}"
        )

    # 3) Magic-byte MIME -------------------------------------------------------
    detected_mime = _detect_mime(file_obj)
    if detected_mime not in allowed_mimes:
        nice = ", ".join(sorted(allowed_mimes))
        logger.warning(
            "Upload rejected: extension=%s detected_mime=%s file=%s",
            ext, detected_mime, file_obj.name,
        )
        raise ValidationError(
            f"File content type '{detected_mime}' does not match an allowed "
            f"type for {label}. This may indicate the file is disguised or corrupted."
        )


# ---------------------------------------------------------------------------
# Convenience wrappers
# ---------------------------------------------------------------------------

def validate_image_upload(file_obj, *, max_size_mb: int = 5) -> None:
    """Validate an image upload (avatar / profile photo)."""
    _validate_upload(
        file_obj,
        allowed_mimes=IMAGE_MIMES,
        allowed_extensions=IMAGE_EXTENSIONS,
        max_size_bytes=max_size_mb * 1024 * 1024,
        label="image",
    )


def validate_document_upload(file_obj, *, max_size_mb: int = 20) -> None:
    """Validate a document upload (classroom materials)."""
    _validate_upload(
        file_obj,
        allowed_mimes=DOCUMENT_MIMES,
        allowed_extensions=DOCUMENT_EXTENSIONS,
        max_size_bytes=max_size_mb * 1024 * 1024,
        label="document",
    )


# ---------------------------------------------------------------------------
# DRF serializer field with built-in validation
# ---------------------------------------------------------------------------

class ValidatedFileField(serializers.FileField):
    """
    A ``FileField`` that validates content-type via python-magic.

    Parameters
    ----------
    allowed_mime_prefixes : list[str]
        Each uploaded file's detected MIME must start with at least one prefix.
        Example: ``["image/", "application/pdf"]``
    allowed_extensions : list[str]
        Accepted file extensions (with leading dot).
    max_size_mb : int
        Maximum file size in megabytes.
    """

    def __init__(
        self,
        *args,
        allowed_mime_prefixes: Iterable[str] | None = None,
        allowed_extensions: Iterable[str] | None = None,
        max_size_mb: int = 20,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self._allowed_prefixes = list(allowed_mime_prefixes or [])
        self._allowed_extensions = set(allowed_extensions or [])
        self._max_size_bytes = max_size_mb * 1024 * 1024

    def to_internal_value(self, data):
        file_obj = super().to_internal_value(data)

        # Size
        if file_obj.size > self._max_size_bytes:
            max_mb = self._max_size_bytes / (1024 * 1024)
            raise serializers.ValidationError(
                f"File exceeds the maximum size of {max_mb:.0f} MB."
            )

        # Extension
        if self._allowed_extensions:
            ext = os.path.splitext(file_obj.name or "")[1].lower()
            if ext not in self._allowed_extensions:
                nice = ", ".join(sorted(self._allowed_extensions))
                raise serializers.ValidationError(
                    f"Extension '{ext}' is not allowed. Accepted: {nice}"
                )

        # Magic-byte content type
        if self._allowed_prefixes:
            detected = _detect_mime(file_obj)
            if not any(detected.startswith(p) for p in self._allowed_prefixes):
                raise serializers.ValidationError(
                    f"Detected content type '{detected}' is not allowed. "
                    f"The file may be disguised or corrupted."
                )

        return file_obj
