"""
PDF processing service for extracting questions from uploaded PDFs.
"""
import PyPDF2
from typing import List


class PDFService:
    """Service for handling PDF operations"""

    @staticmethod
    def extract_questions(pdf_path: str) -> List[str]:
        """
        Reads a PDF and extracts all lines containing a question mark.

        Args:
            pdf_path (str): Path to the PDF file

        Returns:
            list: List of questions found in the PDF

        Raises:
            FileNotFoundError: If PDF file not found
            Exception: For other PDF processing errors
        """
        questions = []

        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = "".join(page.extract_text() or "" for page in reader.pages)

        # Extract lines containing questions
        for line in text.split("\n"):
            line = line.strip()
            if "?" in line and len(line) > 3:
                questions.append(line)

        return questions
