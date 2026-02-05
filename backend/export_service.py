"""
Export Service - Export TipTap documents to PDF/DOCX via Pandoc.

Converts TipTap JSON to Markdown, then uses Pandoc for PDF/DOCX export.
Supports document structure, formatting, and citations.
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


class PandocNotFoundError(Exception):
    """Pandoc is not installed or not in PATH."""
    pass


class ConversionError(Exception):
    """Pandoc conversion failed."""
    pass


class TimeoutError(Exception):
    """Conversion timeout exceeded."""
    pass


class ExportService:
    """Service for exporting TipTap documents to PDF/DOCX via Pandoc."""

    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "research_pilot_exports"
        self.temp_dir.mkdir(exist_ok=True)
        self.timeout = 30  # seconds

        # Verify Pandoc is installed
        self._check_pandoc()

    def _check_pandoc(self):
        """Verify Pandoc is available."""
        try:
            result = subprocess.run(
                ["pandoc", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            self.pandoc_available = result.returncode == 0
            if self.pandoc_available:
                version = result.stdout.split('\n')[0]
                logger.info(f"Pandoc detected: {version}")
            else:
                raise PandocNotFoundError(
                    "Pandoc not found. Install from https://pandoc.org/installing.html"
                )
        except FileNotFoundError:
            self.pandoc_available = False
            raise PandocNotFoundError(
                "Pandoc not found in PATH. Install from https://pandoc.org/installing.html"
            )
        except subprocess.TimeoutExpired:
            self.pandoc_available = False
            raise PandocNotFoundError("Pandoc check timed out")

        # Detect available PDF engines
        self.pdf_engine = self._detect_pdf_engine()
        if self.pdf_engine:
            logger.info(f"PDF engine detected: {self.pdf_engine}")
        else:
            logger.warning("No PDF engine found. PDF export will require latex/xelatex installation.")

    def _detect_pdf_engine(self) -> Optional[str]:
        """Detect available PDF engines for Pandoc."""
        engines = ["xelatex", "pdflatex", "lualatex"]

        for engine in engines:
            try:
                result = subprocess.run(
                    [engine, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    return engine
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue

        return None

    def export_to_pdf(
        self,
        tiptap_json: dict,
        title: str = "Document",
        author: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> bytes:
        """
        Export TipTap JSON to PDF.

        Args:
            tiptap_json: TipTap document JSON
            title: Document title
            author: Optional author name
            metadata: Optional metadata dict

        Returns:
            PDF file as bytes

        Raises:
            PandocNotFoundError: If Pandoc not installed
            ConversionError: If conversion fails
            TimeoutError: If conversion exceeds timeout
        """
        # Check for PDF engine
        if not self.pdf_engine:
            raise ConversionError(
                "PDF export requires LaTeX. Install xelatex/pdflatex:\n"
                "  Ubuntu/Debian: sudo apt-get install texlive-xetex\n"
                "  MacOS: brew install mactex\n"
                "  Or use DOCX export instead."
            )

        # Convert TipTap to Markdown
        markdown = self.tiptap_to_markdown(tiptap_json)

        # Add YAML frontmatter
        markdown_with_meta = self._add_frontmatter(markdown, title, author, metadata)

        # Create temp files
        input_path = self.temp_dir / f"input_{datetime.now().strftime('%Y%m%d%H%M%S%f')}.md"
        output_path = input_path.with_suffix(".pdf")

        try:
            # Write markdown input
            input_path.write_text(markdown_with_meta, encoding="utf-8")

            # Run Pandoc with detected PDF engine
            cmd = [
                "pandoc",
                str(input_path),
                "-o", str(output_path),
                f"--pdf-engine={self.pdf_engine}",
                "-V", "geometry:margin=1in",
                "-V", "fontsize=12pt",
                "-V", "colorlinks=true",
                "-V", "linkcolor=blue",
                "-V", "urlcolor=blue"
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )

            if result.returncode != 0:
                logger.error(f"Pandoc PDF conversion failed: {result.stderr}")
                raise ConversionError(f"PDF conversion failed: {result.stderr}")

            # Read output file
            pdf_bytes = output_path.read_bytes()

            logger.info(f"Successfully exported '{title}' to PDF ({len(pdf_bytes)} bytes)")
            return pdf_bytes

        except subprocess.TimeoutExpired:
            raise TimeoutError(f"PDF conversion exceeded {self.timeout}s timeout")
        except Exception as e:
            logger.error(f"PDF export error: {e}")
            raise ConversionError(f"PDF export failed: {str(e)}")
        finally:
            # Cleanup temp files
            for path in [input_path, output_path]:
                try:
                    if path.exists():
                        path.unlink()
                except Exception:
                    pass

    def export_to_docx(
        self,
        tiptap_json: dict,
        title: str = "Document",
        author: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> bytes:
        """
        Export TipTap JSON to DOCX.

        Args:
            tiptap_json: TipTap document JSON
            title: Document title
            author: Optional author name
            metadata: Optional metadata dict

        Returns:
            DOCX file as bytes

        Raises:
            PandocNotFoundError: If Pandoc not installed
            ConversionError: If conversion fails
            TimeoutError: If conversion exceeds timeout
        """
        # Convert TipTap to Markdown
        markdown = self.tiptap_to_markdown(tiptap_json)

        # Add YAML frontmatter
        markdown_with_meta = self._add_frontmatter(markdown, title, author, metadata)

        # Create temp files
        input_path = self.temp_dir / f"input_{datetime.now().strftime('%Y%m%d%H%M%S%f')}.md"
        output_path = input_path.with_suffix(".docx")

        try:
            # Write markdown input
            input_path.write_text(markdown_with_meta, encoding="utf-8")

            # Run Pandoc
            cmd = [
                "pandoc",
                str(input_path),
                "-o", str(output_path),
                "--standalone"
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )

            if result.returncode != 0:
                logger.error(f"Pandoc DOCX conversion failed: {result.stderr}")
                raise ConversionError(f"DOCX conversion failed: {result.stderr}")

            # Read output file
            docx_bytes = output_path.read_bytes()

            logger.info(f"Successfully exported '{title}' to DOCX ({len(docx_bytes)} bytes)")
            return docx_bytes

        except subprocess.TimeoutExpired:
            raise TimeoutError(f"DOCX conversion exceeded {self.timeout}s timeout")
        except Exception as e:
            logger.error(f"DOCX export error: {e}")
            raise ConversionError(f"DOCX export failed: {str(e)}")
        finally:
            # Cleanup temp files
            for path in [input_path, output_path]:
                try:
                    if path.exists():
                        path.unlink()
                except Exception:
                    pass

    def tiptap_to_markdown(self, tiptap_json: dict) -> str:
        """
        Convert TipTap JSON to Markdown.

        Handles:
        - Headings (h1-h6)
        - Paragraphs
        - Bold, italic, strike, code
        - Lists (ordered, unordered, nested)
        - Blockquotes
        - Code blocks
        - Horizontal rules
        - Links
        - Citations (placeholder format)
        """
        if not tiptap_json or not isinstance(tiptap_json, dict):
            return ""

        content = tiptap_json.get("content", [])

        if not content:
            return ""

        markdown_lines = []
        in_list = False

        for node in content:
            node_type = node.get("type")

            if node_type == "heading":
                level = node.get("attrs", {}).get("level", 1)
                text = self._extract_text(node.get("content", []))
                markdown_lines.append(f"{'#' * level} {text}\n")

            elif node_type == "paragraph":
                text = self._extract_inline_content(node.get("content", []))
                if text.strip():
                    markdown_lines.append(f"{text}\n")
                in_list = False

            elif node_type == "bulletList":
                if not in_list:
                    in_list = True
                items = node.get("content", [])
                for item in items:
                    item_text = self._extract_list_item(item, bullet=True)
                    markdown_lines.append(item_text)
                markdown_lines.append("")  # Blank line after list

            elif node_type == "orderedList":
                if not in_list:
                    in_list = True
                items = node.get("content", [])
                start = node.get("attrs", {}).get("start", 1)
                for i, item in enumerate(items, start):
                    item_text = self._extract_list_item(item, bullet=False, index=i)
                    markdown_lines.append(item_text)
                markdown_lines.append("")  # Blank line after list

            elif node_type == "blockquote":
                text = self._extract_inline_content(node.get("content", []))
                for line in text.split("\n"):
                    markdown_lines.append(f"> {line}")
                markdown_lines.append("")

            elif node_type == "codeBlock":
                code = node.get("content", [{}])[0].get("text", "")
                language = node.get("attrs", {}).get("language", "")
                markdown_lines.append(f"```{language}\n{code}\n```\n")

            elif node_type == "horizontalRule":
                markdown_lines.append("---\n")

            elif node_type == "citation":
                # Citation placeholder - could be enhanced with actual citation data
                citation_id = node.get("attrs", {}).get("id", "")
                markdown_lines.append(f"[@{citation_id}]")

        return "\n".join(markdown_lines)

    def _extract_text(self, content: list) -> str:
        """Extract plain text from content nodes (no formatting)."""
        if not content:
            return ""

        text_parts = []
        for node in content:
            if node.get("type") == "text":
                text_parts.append(node.get("text", ""))
            elif node.get("content"):
                text_parts.append(self._extract_text(node.get("content", [])))

        return "".join(text_parts)

    def _extract_inline_content(self, content: list) -> str:
        """Extract inline content with formatting marks."""
        if not content:
            return ""

        result = []

        for node in content:
            node_type = node.get("type")

            if node_type == "text":
                text = node.get("text", "")
                marks = node.get("marks", [])

                # Apply formatting marks
                for mark in marks:
                    mark_type = mark.get("type")
                    if mark_type == "bold":
                        text = f"**{text}**"
                    elif mark_type == "italic":
                        text = f"*{text}*"
                    elif mark_type == "strike":
                        text = f"~~{text}~~"
                    elif mark_type == "code":
                        text = f"`{text}`"
                    elif mark_type == "link":
                        attrs = mark.get("attrs", {})
                        href = attrs.get("href", "")
                        text = f"[{text}]({href})"

                result.append(text)

            elif node_type == "hardBreak":
                result.append("\n")

            elif node_type == "mention":
                # Mention/citation placeholder
                attrs = node.get("attrs", {})
                result.append(f"[{attrs.get('id', '')}]")

            elif node.get("content"):
                # Recursively handle nested content
                result.append(self._extract_inline_content(node.get("content", [])))

        return "".join(result)

    def _extract_list_item(self, item_node: dict, bullet: bool = True, index: int = 1) -> str:
        """Extract list item with proper nesting."""
        content = item_node.get("content", [])
        if not content:
            return ""

        # Get first node's text
        first_node = content[0]
        if first_node.get("type") == "paragraph":
            item_text = self._extract_inline_content(first_node.get("content", []))
        else:
            item_text = self._extract_inline_content(content)

        # Check for nested lists
        nested = []
        for node in content[1:]:
            if node.get("type") in ["bulletList", "orderedList"]:
                nested_items = node.get("content", [])
                for i, nested_item in enumerate(nested_items):
                    nested_bullet = node.get("type") == "bulletList"
                    nested_index = i + 1 if not nested_bullet else 0
                    nested.append(self._extract_list_item(nested_item, nested_bullet, nested_index))

        # Build list item line
        prefix = "-" if bullet else f"{index}."
        line = f"{prefix} {item_text}"

        # Add nested items with indentation
        if nested:
            line = "\n".join([line] + [f"  {n}" for n in nested])

        return line

    def _add_frontmatter(
        self,
        markdown: str,
        title: str,
        author: Optional[str],
        metadata: Optional[dict]
    ) -> str:
        """Add YAML frontmatter to markdown."""
        frontmatter = [
            "---",
            f'title: "{title}"'
        ]

        if author:
            frontmatter.append(f'author: "{author}"')

        frontmatter.append(f'date: "{datetime.now().strftime("%Y-%m-%d")}"')

        if metadata:
            if metadata.get("abstract"):
                frontmatter.append(f'abstract: "{metadata["abstract"][:200]}..."')
            if metadata.get("keywords"):
                keywords = ", ".join(metadata["keywords"])
                frontmatter.append(f'keywords: [{keywords}]')

        frontmatter.append("---")
        frontmatter.append("")

        return "\n".join(frontmatter) + "\n" + markdown

    def get_supported_formats(self) -> list:
        """Get list of supported export formats."""
        if self.pandoc_available:
            return ["pdf", "docx", "markdown", "html"]
        return ["markdown", "html"]


# Singleton instance
export_service = ExportService()
