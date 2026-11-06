#!/usr/bin/env python3
"""Validate all checked-in SVG assets using Python's XML parser."""
from pathlib import Path
import xml.etree.ElementTree as ET

count=0
for path in Path('assets').rglob('*.svg'):
    try:
        root=ET.parse(path).getroot()
    except ET.ParseError as error:
        raise SystemExit(f'Invalid SVG XML: {path}: {error}')
    if not root.tag.endswith('svg'):
        raise SystemExit(f'Unexpected SVG root: {path}')
    if 'viewBox' not in root.attrib:
        raise SystemExit(f'Missing viewBox: {path}')
    count+=1
print(f'Validated {count} SVG assets')
