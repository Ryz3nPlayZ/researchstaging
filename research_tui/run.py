#!/usr/bin/env python
"""Research Pilot TUI - Entry point"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import run

if __name__ == "__main__":
    run()
