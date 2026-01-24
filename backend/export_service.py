"""
Export Service - Export documents to various formats using Pandoc.
Supports PDF, DOCX, and Markdown.
"""
import os
import tempfile
import subprocess
import logging
from pathlib import Path
from typing import Optional, Literal
from datetime import datetime

logger = logging.getLogger(__name__)

ExportFormat = Literal["pdf", "docx", "markdown", "html"]


class ExportService:
    """Service for exporting documents to various formats using Pandoc."""
    
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "research_pilot_exports"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Verify Pandoc is installed
        try:
            result = subprocess.run(
                ["pandoc", "--version"],
                capture_output=True,
                text=True
            )
            self.pandoc_available = result.returncode == 0
            if self.pandoc_available:
                logger.info(f"Pandoc available: {result.stdout.split()[1]}")
        except FileNotFoundError:
            self.pandoc_available = False
            logger.warning("Pandoc not found - export functionality limited")
    
    def export_document(
        self,
        content: str,
        title: str,
        format: ExportFormat,
        author: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> Optional[bytes]:
        """
        Export content to specified format.
        Returns the file content as bytes.
        """
        if not self.pandoc_available and format in ["pdf", "docx"]:
            logger.error("Pandoc not available for conversion")
            return None
        
        # Prepare markdown with metadata header
        md_content = self._prepare_markdown(content, title, author, metadata)
        
        # Create temp input file
        input_path = self.temp_dir / f"input_{datetime.now().strftime('%Y%m%d%H%M%S')}.md"
        input_path.write_text(md_content, encoding="utf-8")
        
        try:
            if format == "markdown":
                return md_content.encode("utf-8")
            elif format == "html":
                return self._convert_to_html(input_path)
            elif format == "docx":
                return self._convert_to_docx(input_path)
            elif format == "pdf":
                return self._convert_to_pdf(input_path)
            else:
                logger.error(f"Unsupported format: {format}")
                return None
        finally:
            # Cleanup
            try:
                input_path.unlink()
            except Exception:
                pass
    
    def _prepare_markdown(
        self,
        content: str,
        title: str,
        author: Optional[str],
        metadata: Optional[dict]
    ) -> str:
        """Prepare markdown with YAML frontmatter."""
        # Build YAML frontmatter
        frontmatter_parts = [
            "---",
            f'title: "{title}"',
        ]
        
        if author:
            frontmatter_parts.append(f'author: "{author}"')
        
        frontmatter_parts.append(f'date: "{datetime.now().strftime("%Y-%m-%d")}"')
        
        if metadata:
            if metadata.get("abstract"):
                frontmatter_parts.append(f'abstract: "{metadata["abstract"]}"')
            if metadata.get("keywords"):
                keywords = ", ".join(metadata["keywords"])
                frontmatter_parts.append(f'keywords: "{keywords}"')
        
        frontmatter_parts.append("---\n")
        
        return "\n".join(frontmatter_parts) + "\n" + content
    
    def _convert_to_html(self, input_path: Path) -> Optional[bytes]:
        """Convert markdown to HTML."""
        output_path = input_path.with_suffix(".html")
        
        try:
            result = subprocess.run(
                [
                    "pandoc",
                    str(input_path),
                    "-o", str(output_path),
                    "--standalone",
                    "--metadata", "pagetitle=Research Document"
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"Pandoc HTML conversion failed: {result.stderr}")
                return None
            
            content = output_path.read_bytes()
            output_path.unlink()
            return content
        except Exception as e:
            logger.error(f"HTML conversion error: {e}")
            return None
    
    def _convert_to_docx(self, input_path: Path) -> Optional[bytes]:
        """Convert markdown to DOCX."""
        output_path = input_path.with_suffix(".docx")
        
        try:
            result = subprocess.run(
                [
                    "pandoc",
                    str(input_path),
                    "-o", str(output_path),
                    "--standalone"
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"Pandoc DOCX conversion failed: {result.stderr}")
                return None
            
            content = output_path.read_bytes()
            output_path.unlink()
            return content
        except Exception as e:
            logger.error(f"DOCX conversion error: {e}")
            return None
    
    def _convert_to_pdf(self, input_path: Path) -> Optional[bytes]:
        """Convert markdown to PDF."""
        output_path = input_path.with_suffix(".pdf")
        
        try:
            # Use HTML as intermediate for PDF (more reliable without LaTeX)
            result = subprocess.run(
                [
                    "pandoc",
                    str(input_path),
                    "-o", str(output_path),
                    "--pdf-engine=weasyprint"
                ],
                capture_output=True,
                text=True
            )
            
            # Fallback to wkhtmltopdf or basic HTML if weasyprint not available
            if result.returncode != 0:
                # Try alternative: convert to HTML first
                html_content = self._convert_to_html(input_path)
                if html_content:
                    # Return HTML as fallback
                    logger.warning("PDF conversion failed, returning HTML")
                    return html_content
                return None
            
            content = output_path.read_bytes()
            output_path.unlink()
            return content
        except Exception as e:
            logger.error(f"PDF conversion error: {e}")
            return None
    
    def get_supported_formats(self) -> list:
        """Get list of supported export formats."""
        formats = ["markdown", "html"]
        if self.pandoc_available:
            formats.extend(["docx", "pdf"])
        return formats


# Singleton instance
export_service = ExportService()
