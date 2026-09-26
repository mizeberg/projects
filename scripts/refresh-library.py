#!/usr/bin/env python3
"""Verify pinned official sources and rebuild extracted text. Run from repository root.

Requires scripts/requirements-content.txt. Does not silently accept changed PDFs:
review any upstream changes before using --accept-updates.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date
import hashlib
import json
from pathlib import Path
import urllib.request
import urllib.parse
from pypdf import PdfReader

parser = argparse.ArgumentParser(description=__doc__)
group = parser.add_mutually_exclusive_group()
group.add_argument("--accept-updates", action="store_true")
group.add_argument("--offline", action="store_true", help="Verify bundled hashes and re-extract text without contacting sources")
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
manifest_path = root / "src/data/gate-library.json"
library = json.loads(manifest_path.read_text())
allowed_hosts = {"gate2027.iitm.ac.in", "gate2026.iitg.ac.in"}


def refresh(document):
    doc = dict(document)
    source = urllib.parse.urlparse(doc["source"])
    if source.scheme != "https" or source.hostname not in allowed_hosts:
        raise ValueError("Unapproved source: " + doc["id"])
    if args.offline:
        if doc["bundled"]:
            path = root / "public/library" / (doc["id"] + ".pdf")
            content = path.read_bytes()
            if hashlib.sha256(content).hexdigest() != doc["sha256"]:
                raise ValueError("Bundled PDF hash mismatch: " + doc["id"])
            doc["pages"] = [page.extract_text(extraction_mode="layout").strip() for page in PdfReader(path).pages]
            if not doc["pages"] or not all(doc["pages"]):
                raise ValueError("Text extraction incomplete: " + doc["id"])
        return doc
    request = urllib.request.Request(doc["source"], method="GET" if doc["bundled"] else "HEAD")
    with urllib.request.urlopen(request, timeout=60) as response:
        if urllib.parse.urlparse(response.url).hostname not in allowed_hosts:
            raise ValueError("Unexpected source redirect")
        if doc["bundled"]:
            content = response.read(32 * 1024 * 1024 + 1)
            if not content.startswith(b"%PDF-") or len(content) > 32 * 1024 * 1024:
                raise ValueError("Source did not return a PDF (it may require a browser verification). Bundled content was retained: " + doc["id"])
            digest = hashlib.sha256(content).hexdigest()
            if digest != doc["sha256"] and not args.accept_updates:
                raise ValueError("Official PDF changed; review before accepting: " + doc["id"])
            path = root / "public/library" / (doc["id"] + ".pdf")
            path.write_bytes(content)
            doc["sha256"] = digest
            doc["bytes"] = len(content)
            doc["pages"] = [page.extract_text(extraction_mode="layout").strip() for page in PdfReader(path).pages]
            if not doc["pages"] or not all(doc["pages"]):
                raise ValueError("Text extraction incomplete: " + doc["id"])
        else:
            doc["bytes"] = int(response.headers["Content-Length"])
            if not 0 < doc["bytes"] <= 32 * 1024 * 1024:
                raise ValueError("Unexpected file size: " + doc["id"])
    return doc


with ThreadPoolExecutor(max_workers=4) as pool:
    documents = list(pool.map(refresh, library["documents"]))
library["documents"] = documents
if not args.offline:
    library["checkedAt"] = date.today().isoformat()
manifest_path.write_text(json.dumps(library, ensure_ascii=False, indent=2) + "\n")
(root / "public/library/catalog.json").write_text(json.dumps([
    {key: value for key, value in doc.items() if key != "pages"} for doc in documents
], indent=2) + "\n")
print("Verified bundled PDF hashes and extracted text; source check date retained." if args.offline else f"Verified {len(documents)} official source documents; inspect the diff before publishing.")
