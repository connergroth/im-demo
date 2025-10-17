"""
File handling utilities.
"""
import os
from pathlib import Path
from werkzeug.utils import secure_filename
from typing import Optional


def allowed_file(filename: str, allowed_extensions: set) -> bool:
    """
    Check if file has an allowed extension.

    Args:
        filename (str): Name of the file
        allowed_extensions (set): Set of allowed extensions

    Returns:
        bool: True if file extension is allowed
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def save_upload(file, upload_folder: Path) -> Optional[str]:
    """
    Save an uploaded file securely.

    Args:
        file: File object from request
        upload_folder (Path): Directory to save the file

    Returns:
        str: Path to saved file or None if error
    """
    try:
        filename = secure_filename(file.filename)
        filepath = upload_folder / filename
        file.save(str(filepath))
        return str(filepath)
    except Exception as e:
        print(f"Error saving file: {e}")
        return None


def cleanup_file(filepath: str) -> bool:
    """
    Remove a file from the filesystem.

    Args:
        filepath (str): Path to file to remove

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
    except Exception as e:
        print(f"Error removing file: {e}")
        return False
