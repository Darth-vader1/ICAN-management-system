import os
from django.core.files.storage import Storage
from django.conf import settings
from django.utils.deconstruct import deconstructible
import cloudinary
import cloudinary.uploader
import cloudinary.api

@deconstructible
class CloudinaryMediaStorage(Storage):
    """
    A custom storage backend for Cloudinary that replaces the abandoned django-cloudinary-storage.
    """
    def __init__(self, **kwargs):
        self.options = kwargs
        if hasattr(settings, 'CLOUDINARY_STORAGE'):
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_STORAGE.get("CLOUD_NAME"),
                api_key=settings.CLOUDINARY_STORAGE.get("API_KEY"),
                api_secret=settings.CLOUDINARY_STORAGE.get("API_SECRET"),
                secure=True
            )
        self.prefix = getattr(settings, 'CLOUDINARY_STORAGE', {}).get("PREFIX", "media")

    def _open(self, name, mode='rb'):
        raise NotImplementedError("Direct reading of Cloudinary files is not supported.")

    def _save(self, name, content):
        public_id = f"{self.prefix}/{os.path.splitext(name)[0]}"
        content.seek(0)
        
        response = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type="auto"
        )
        
        # Store the public_id in the database, appending the extension if any
        # Some Django image fields expect an extension.
        ext = os.path.splitext(name)[1]
        return f"{response['public_id']}{ext}"

    def exists(self, name):
        # We assume false to allow overwrite / duplicate names to be handled by Cloudinary
        return False

    def url(self, name):
        if not name:
            return ""
        if name.startswith('http'):
            return name
        
        # Remove extension from public_id since Cloudinary handles formats dynamically if desired
        public_id = os.path.splitext(name)[0]
        url, _options = cloudinary.utils.cloudinary_url(public_id, secure=True)
        return url

    def delete(self, name):
        if not name or name.startswith('http'):
            return
        public_id = os.path.splitext(name)[0]
        try:
            cloudinary.uploader.destroy(public_id)
        except Exception:
            pass
