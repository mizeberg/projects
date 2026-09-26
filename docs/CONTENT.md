# Official syllabus and learning library

## Release 1.1.0 coverage

The library contains **all 30 GATE 2027 test-paper syllabuses**, General Aptitude, and the GATE 2026 Textile Engineering & Fibre Science archive: **32 original PDFs and 108 extracted pages** bundled offline. Official combined XE, XH and XL documents include their elective sections. The documents were retrieved from the official organizing institutes on **2026-09-26**.

The 2027 source introduces **Robotics & Automation (RA)**, revises syllabuses, and changes XE/XH/XL section codes. Textile content is **XE9** in the 2027 Engineering Sciences syllabus. TF is displayed explicitly as a **2026 archive**. Never silently apply the 2026 syllabus to a 2027 target.

- Current syllabus index: https://gate2027.iitm.ac.in/exam_papers_and_syllabus
- Official 2026 papers and keys: https://gate2026.iitg.ac.in/QPs-answer-keys.html
- TF archive: https://gate2026.iitg.ac.in/exam-papers-and-syllabus.html
- NPTEL GATE resource catalogue: https://gate.nptel.ac.in/
- NPTEL course catalogue: https://nptel.ac.in/courses

**38 official 2026 question papers and 38 corresponding answer keys** are indexed with exact published URLs and file sizes. Separate sessions/electives retain their identities, including CS1/CS2, CE1/CE2, GG and XH variants. No 2026 RA paper exists. GA practice is within each test paper. Keys provide final answers, not worked solutions. The paper collection is not an interactive scored mock test.

## Content and provenance boundaries

`src/data/gate-library.json` is the source manifest: source URL, publisher, year, paper code, resource kind, byte size, extracted syllabus pages, and SHA-256 for each bundled original. `public/library/catalog.json` is the same manifest without text, used by Android's native reader. `public/library/*.pdf` are unchanged official originals; they are separate from the project's original code and remain attributable to their publishers. GATENOVA is independent and has no GATE/IIT endorsement. Dates and source links are visible in the app.

Extracted text improves search and accessibility. It can lose mathematical layout; the original PDF is authoritative. Documents are a dated snapshot, not a continuously synchronized feed. Future official amendments require a verified content update and APK rebuild.

Six original interactive starter lessons provide concept explanations and questions, clearly labeled as authored content. They do not cover every subject. Full textbook collections, paid coaching notes, worked solutions, course videos and an unrestricted AI tutor are not included. Course links open the provider website and need internet. We do not fabricate missing teaching material, citations or PYQs.

## Offline and Android behavior

All syllabus text, PDFs, authored lessons, fonts, notes and learning state are available offline in the APK. Selecting a question paper/key opens an isolated native PDF reader, downloads from its explicit official HTTPS source, validates the file, then retains it in private app storage. Subsequent opens work offline. Back returns to the same library view. The reader supports page navigation and zoom. Native PDF canvas pages themselves do not expose a text layer; syllabus text remains available through the accessible app reader.

The first paper/key download requires internet and storage. There is no automatic bulk download of approximately 180 MB of papers. No video is bundled. Clearing app storage/uninstalling removes downloads and local learning data. Updates with the same signing key retain them. Browser users read bundled syllabus text within the app; PDF links open a browser tab. The web service worker caches public syllabuses, fonts and application chunks, never account APIs.

The Android network permission is used by a native downloader. MainActivity's WebView still denies network requests and remote scripts. The document activity is not exported, only accepts signed-catalog IDs, disallows HTTP/redirects/arbitrary hosts, caps files at 32 MB, applies timeouts, and uses atomic completion before offline storage. PDF content has no JavaScript bridge. No provider keys are embedded.

## Branch configuration and compatibility

`src/lib/branches.js` holds official names and legacy aliases shared with server validation. Existing ECE/CSE/Mechanical/Civil/AIML/Cybersecurity profiles retain saved progress and map to EC/CS/ME/CE/DA/CS. Cybersecurity is not advertised as a separate official paper. Common aptitude starter lessons exist for every paper; specific authored lessons are filtered by paper equivalence.

Syllabus page review marks are stored with a syllabus/year/page identity in the existing bookmark collection. They award no XP and are not represented as mastery. Switching papers never deletes past learning, notes or bookmarks.

## Refreshing pinned sources

Builds use committed content and need no scraper or Python installation. To verify/refresh sources:

```sh
python3 -m venv /tmp/gatenova-content-venv
/tmp/gatenova-content-venv/bin/pip install -r scripts/requirements-content.txt
/tmp/gatenova-content-venv/bin/python scripts/refresh-library.py
npm test
```

The refresh script verifies pinned official sources, rejects silently changed bundled PDFs, and regenerates readable text/catalog metadata. Review changed official content before using `--accept-updates`. Some official sites may temporarily return browser-verification HTML instead of a PDF. The refresh command fails closed in that case; existing bundled originals remain usable. Use `python scripts/refresh-library.py --offline` to verify bundled hashes and re-extract text without advancing the last source-check date.

Adding a new exam year requires comparing the official index, updating the manifest, branch mapping and coverage tests, then checking layout and building a new signed APK. Never substitute generated content for an official document.
