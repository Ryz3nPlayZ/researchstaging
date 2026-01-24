"""
PDF Service - PDF acquisition, parsing, and full-text extraction.
Uses PyMuPDF for fast extraction with pdfplumber fallback for tables.
"""
import os
import tempfile
import asyncio
import logging
import httpx
import fitz  # PyMuPDF
import pdfplumber
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path
import re

logger = logging.getLogger(__name__)


class PDFService:
    """Service for downloading and parsing PDF documents."""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=60.0, follow_redirects=True)
        self.temp_dir = Path(tempfile.gettempdir()) / "research_pilot_pdfs"
        self.temp_dir.mkdir(exist_ok=True)
    
    async def download_pdf(self, url: str, paper_id: str) -> Optional[Path]:
        """Download a PDF from URL."""
        if not url:
            return None
        
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            
            # Check if it's actually a PDF
            content_type = response.headers.get("content-type", "")
            if "pdf" not in content_type.lower() and not url.endswith(".pdf"):
                logger.warning(f"URL {url} does not appear to be a PDF")
                return None
            
            pdf_path = self.temp_dir / f"{paper_id}.pdf"
            pdf_path.write_bytes(response.content)
            
            return pdf_path
        except Exception as e:
            logger.error(f"Failed to download PDF from {url}: {e}")
            return None
    
    def extract_text_pymupdf(self, pdf_path: Path) -> Tuple[str, bool]:
        """
        Extract text using PyMuPDF (fast path).
        Returns (text, has_tables) tuple.
        """
        try:
            doc = fitz.open(pdf_path)
            text_parts = []
            has_tables = False
            
            for page_num, page in enumerate(doc):
                text = page.get_text("text")
                text_parts.append(f"\n--- Page {page_num + 1} ---\n{text}")
                
                # Detect potential tables by looking for grid-like patterns
                blocks = page.get_text("dict")["blocks"]
                for block in blocks:
                    if block.get("type") == 0:  # Text block
                        lines = block.get("lines", [])
                        if len(lines) > 3:
                            # Check for columnar alignment (potential table)
                            x_coords = [span["bbox"][0] for line in lines for span in line.get("spans", [])]
                            if len(set(round(x, -1) for x in x_coords)) > 3:
                                has_tables = True
            
            doc.close()
            return "\n".join(text_parts), has_tables
        except Exception as e:
            logger.error(f"PyMuPDF extraction failed: {e}")
            return "", True  # Fallback to pdfplumber
    
    def extract_text_pdfplumber(self, pdf_path: Path) -> str:
        """
        Extract text using pdfplumber (handles tables better).
        """
        try:
            text_parts = []
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text_parts.append(f"\n--- Page {page_num + 1} ---\n")
                    
                    # Extract tables first
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            text_parts.append("\n[TABLE]\n")
                            for row in table:
                                row_text = " | ".join(str(cell) if cell else "" for cell in row)
                                text_parts.append(row_text + "\n")
                            text_parts.append("[/TABLE]\n")
                    
                    # Extract remaining text
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
            
            return "\n".join(text_parts)
        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {e}")
            return ""
    
    async def extract_full_text(self, pdf_path: Path) -> Dict[str, Any]:
        """
        Extract full text from PDF using hybrid approach.
        PyMuPDF for fast extraction, pdfplumber fallback for tables.
        """
        # Try PyMuPDF first (fast path)
        text, has_tables = self.extract_text_pymupdf(pdf_path)
        
        extraction_method = "pymupdf"
        
        # If tables detected or poor extraction, use pdfplumber
        if has_tables or len(text.strip()) < 100:
            logger.info(f"Using pdfplumber fallback for {pdf_path}")
            text = self.extract_text_pdfplumber(pdf_path)
            extraction_method = "pdfplumber"
        
        # Extract metadata
        metadata = self._extract_metadata(pdf_path)
        
        return {
            "text": text,
            "extraction_method": extraction_method,
            "page_count": metadata.get("page_count", 0),
            "metadata": metadata
        }
    
    def _extract_metadata(self, pdf_path: Path) -> Dict[str, Any]:
        """Extract PDF metadata."""
        try:
            doc = fitz.open(pdf_path)
            metadata = doc.metadata
            page_count = len(doc)
            doc.close()
            
            return {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "page_count": page_count
            }
        except Exception as e:
            logger.error(f"Failed to extract metadata: {e}")
            return {}
    
    async def process_paper(self, paper_id: str, pdf_url: str) -> Optional[Dict[str, Any]]:
        """
        Full pipeline: download PDF and extract text.
        """
        # Download PDF
        pdf_path = await self.download_pdf(pdf_url, paper_id)
        if not pdf_path:
            return None
        
        try:
            # Extract text
            result = await self.extract_full_text(pdf_path)
            result["paper_id"] = paper_id
            result["pdf_path"] = str(pdf_path)
            
            return result
        finally:
            # Cleanup
            try:
                if pdf_path.exists():
                    pdf_path.unlink()
            except Exception:
                pass
    
    async def close(self):
        await self.client.aclose()


# Singleton instance
pdf_service = PDFService()
