import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Download,
  ExternalLink,
  FileText,
  Library,
  Search,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { Button, Empty, Panel, Progress } from "./UI";
import { paperForBranch, type Branch } from "../lib/branches.js";
import { isNativeApp } from "../lib/platform";
import library from "../data/gate-library.json";
import "../library.css";

type Document = (typeof library.documents)[number];
const syllabi = library.documents.filter((d) => d.kind === "syllabus");
const currentPapers = syllabi.filter((d) => d.year === 2027 && d.code !== "GA");
export default function SyllabusLibrary({
  branch,
  bookmarks,
  onBookmark,
  onBranch,
}: {
  branch: Branch;
  bookmarks: string[];
  onBookmark: (id: string) => void;
  onBranch: (branch: Branch) => void;
}) {
  const [code, setCode] = useState(paperForBranch(branch));
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"syllabus" | "resources">("syllabus");
  const [message, setMessage] = useState("");
  useEffect(() => setCode(paperForBranch(branch)), [branch]);
  const syllabus = syllabi.find((d) => d.code === code)!;
  const resources = library.documents.filter(
    (d) => d.code === code && d.kind !== "syllabus",
  );
  const pages = syllabus.pages || [];
  const matches = useMemo(
    () =>
      syllabi.filter((d) =>
        `${d.code} ${d.title} ${(d.pages || []).join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [query],
  );
  const reviewed = pages.filter((_, i) =>
    bookmarks.includes(`${syllabus.id}:page:${i + 1}`),
  ).length;
  function open(doc: Document) {
    setMessage("");
    if (isNativeApp) {
      if (window.GateNovaAndroid?.openResource)
        window.GateNovaAndroid.openResource(doc.id);
      else
        setMessage(
          "The document reader is unavailable. Close and reopen GATENOVA to try again.",
        );
    } else {
      const url = doc.bundled
        ? `${import.meta.env.BASE_URL}library/${doc.id}.pdf`
        : doc.source;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
  return (
    <div className="syllabus-library">
      <header className="library-hero">
        <div className="library-emblem">
          <Library size={30} />
        </div>
        <div>
          <span className="eyebrow">YOUR GATE FIELD GUIDE</span>
          <h1>Every paper. One place.</h1>
          <p>
            Explore the official syllabus, find your next topic, and study with
            source documents close at hand.
          </p>
        </div>
        <div className="library-stamp">
          <ShieldCheck size={18} />
          <span>
            GATE 2027
            <br />
            <strong>{currentPapers.length} official papers</strong>
          </span>
        </div>
      </header>
      <div className="library-facts">
        <span>
          <WifiOff size={15} /> All syllabuses available offline in Android
        </span>
        <span>Source: IIT Madras · checked {library.checkedAt}</span>
      </div>
      <Panel className="library-controls">
        <label>
          Explore a paper
          <select
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setQuery("");
            }}
          >
            {syllabi.map((d) => (
              <option key={d.id} value={d.code}>
                {d.code} · {d.title}
                {d.year !== 2027 ? ` · ${d.year} archive` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="library-search">
          Find a topic across all syllabuses
          <div>
            <Search size={17} />
            <input
              placeholder="Try thermodynamics, economics, or robotics"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </label>
      </Panel>
      {query.trim() && (
        <section
          className="library-results"
          aria-label="Syllabus search results"
        >
          <h2>{matches.length} matching syllabuses</h2>
          {matches.length ? (
            matches.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setCode(d.code);
                  setQuery("");
                  setTab("syllabus");
                }}
              >
                <b>{d.code}</b>
                <span>{d.title}</span>
                <span>{d.year}</span>
              </button>
            ))
          ) : (
            <Empty
              icon={<Search />}
              title="No matching topic"
              description="Try a broader term or browse a paper below."
            />
          )}
        </section>
      )}
      <section className="library-paper-heading">
        <div>
          <span className="eyebrow">
            {syllabus.year} · {code}
          </span>
          <h2>{syllabus.title}</h2>
          <p>
            Official syllabus · {pages.length} pages · {syllabus.publisher}
          </p>
        </div>
        {code !== "GA" && code !== paperForBranch(branch) && (
          <Button
            variant="secondary"
            onClick={() => {
              onBranch(code as Branch);
              setMessage(
                `${code} is now your study paper. Your saved learning is retained.`,
              );
            }}
          >
            Set as my paper
          </Button>
        )}
      </section>
      {code === "TF" && (
        <p className="library-notice">
          This is the 2026 archive. For GATE 2027, Textile Engineering & Fibre
          Science is section XE9 under Engineering Sciences. Select XE to read
          the current requirements.
        </p>
      )}
      {code === "RA" && (
        <p className="library-notice">
          Robotics & Automation is a new paper for 2027. A 2026 RA question
          paper does not exist; Nova will never invent one.
        </p>
      )}
      {branch === "Cybersecurity" && code === "CS" && (
        <p className="library-notice">
          Cybersecurity is a study interest, not a standalone GATE paper. This
          profile uses the official CS syllabus. AIML maps to DA.
        </p>
      )}
      <div className="library-tabs" role="group" aria-label="Library sections">
        <button
          aria-pressed={tab === "syllabus"}
          onClick={() => setTab("syllabus")}
        >
          <BookOpen size={17} /> Syllabus
        </button>
        <button
          aria-pressed={tab === "resources"}
          onClick={() => setTab("resources")}
        >
          <FileText size={17} /> Papers & materials
        </button>
      </div>
      {message && (
        <p className="library-notice" role="status">
          {message}
        </p>
      )}
      {tab === "syllabus" ? (
        <>
          <div className="syllabus-toolbar">
            <div>
              <strong>
                {reviewed} / {pages.length} pages reviewed
              </strong>
              <p>
                Your reading checklist; this does not measure mastery or award
                XP.
              </p>
            </div>
            <Button variant="secondary" onClick={() => open(syllabus)}>
              <FileText size={17} /> Original PDF
            </Button>
          </div>
          <Progress
            value={pages.length ? (reviewed / pages.length) * 100 : 0}
            label="Syllabus pages reviewed"
          />
          <p className="library-caption">
            Readable text extracted from the official PDF. Mathematical layout
            can change during extraction; use Original PDF for exact notation.
            Syllabuses are a dated snapshot, so check the official source for
            later revisions.
          </p>
          <div className="syllabus-pages">
            {pages.map((page, i) => (
              <details
                key={`${syllabus.id}-${i}`}
                open={i === 0 ? true : undefined}
              >
                <summary>
                  <span className="syllabus-page-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    Page {i + 1}
                    <small>
                      {page
                        .trim()
                        .split("\n")
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(" · ")
                        .slice(0, 130)}
                    </small>
                  </span>
                  {bookmarks.includes(`${syllabus.id}:page:${i + 1}`) && (
                    <Check size={19} />
                  )}
                </summary>
                <div className="syllabus-text">
                  {page.split(/\n\s*\n/).map((p, j) => (
                    <p key={j}>{p.replace(/[ \t]{2,}/g, " ")}</p>
                  ))}
                </div>
                <label className="review-checkbox">
                  <input
                    type="checkbox"
                    checked={bookmarks.includes(`${syllabus.id}:page:${i + 1}`)}
                    onChange={() => onBookmark(`${syllabus.id}:page:${i + 1}`)}
                  />{" "}
                  I have reviewed this page
                </label>
              </details>
            ))}
          </div>
          {code !== "GA" && (
            <Button
              variant="secondary"
              onClick={() => {
                setCode("GA");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Explore General Aptitude · common to all papers
            </Button>
          )}
        </>
      ) : (
        <>
          <p className="library-caption">
            Official 2026 papers and answer keys from IIT Guwahati.{" "}
            {isNativeApp
              ? "Tap a document to download and read inside GATENOVA. Downloaded PDFs stay on your device for offline study. First download needs internet."
              : "Official PDFs open in a new browser tab. The Android app includes an offline document reader and saves downloads."}{" "}
            Answer keys are not worked solutions.
          </p>
          <div className="resource-grid">
            {resources.map((d) => (
              <Panel className="resource-card" key={d.id}>
                <span className="resource-type">
                  {d.kind === "key"
                    ? "OFFICIAL ANSWER KEY"
                    : "OFFICIAL QUESTION PAPER"}
                </span>
                <FileText size={25} />
                <h3>{d.title}</h3>
                <p>
                  {d.year} · {d.publisher} · {(d.bytes / 1048576).toFixed(1)} MB
                </p>
                <Button variant="secondary" onClick={() => open(d)}>
                  <Download size={16} />
                  {isNativeApp ? "Read / download" : "Open official PDF"}
                </Button>
              </Panel>
            ))}
          </div>
          {!resources.length && (
            <Empty
              icon={<BookOpen size={28} />}
              title="No separate 2026 paper here"
              description={
                code === "GA"
                  ? "General Aptitude questions are included in each subject paper. Choose a paper to practice them."
                  : "Use the current syllabus and the course resources below. No unverified paper has been added."
              }
            />
          )}
          <div className="library-courses">
            <h2>Keep learning with trusted resources.</h2>
            <p>
              Free course catalogues and GATE preparation resources. Coverage
              varies by subject. These websites need internet and open in your
              browser; videos and textbooks are not bundled.
            </p>
            <a
              href="https://gate.nptel.ac.in/"
              target="_blank"
              rel="noreferrer"
            >
              NPTEL GATE preparation <ExternalLink size={17} />
            </a>
            <a
              href="https://nptel.ac.in/courses"
              target="_blank"
              rel="noreferrer"
            >
              NPTEL course catalogue <ExternalLink size={17} />
            </a>
            <a href={library.papersIndex} target="_blank" rel="noreferrer">
              Official 2026 papers & keys index <ExternalLink size={17} />
            </a>
          </div>
        </>
      )}
      <footer className="library-footer">
        <ShieldCheck size={18} />
        <p>
          Official documents belong to their respective publishers. GATENOVA is
          an independent study tool and is not affiliated with the GATE
          organizing institutes.{" "}
          <a href={syllabus.source} target="_blank" rel="noreferrer">
            View official source
          </a>
          . Nova’s interactive lessons are original starter content and do not
          yet cover the full syllabus.
        </p>
      </footer>
    </div>
  );
}
