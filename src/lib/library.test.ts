import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import library from "../data/gate-library.json" with { type: "json" };
import { branches, paperForBranch } from "./branches.js";
import { validProgress } from "./progress-schema.js";
import { emptyProgress } from "./engine.ts";
import { getTopics } from "./curriculum.ts";
const syllabus = library.documents.filter((d) => d.kind === "syllabus");
test("catalog covers every official 2027 paper, GA, and the separate TF archive", () => {
  const expected =
    "AE AG AR BM BT CE CH CS CY DA EC EE ES EY GE GG IN MA ME MN MT NM PE PH PI RA ST XE XH XL".split(
      " ",
    );
  assert.deepEqual(
    syllabus
      .filter((d) => d.year === 2027 && d.code !== "GA")
      .map((d) => d.code)
      .sort(),
    expected.sort(),
  );
  assert.ok(syllabus.some((d) => d.code === "GA" && d.year === 2027));
  assert.ok(syllabus.some((d) => d.code === "TF" && d.year === 2026));
  assert.match(
    syllabus.find((d) => d.code === "XE")!.pages!.join(" "),
    /XE9\s+Textile Engineering/,
  );
  assert.ok(
    !library.documents.some((d) => d.code === "RA" && d.kind === "paper"),
  );
  assert.equal(library.documents.filter((d) => d.kind === "paper").length, 38);
  assert.equal(library.documents.filter((d) => d.kind === "key").length, 38);
});
test("every bundled PDF matches its recorded official source hash and readable pages", () => {
  const ids = new Set<string>();
  for (const d of library.documents) {
    assert.ok(!ids.has(d.id));
    ids.add(d.id);
    assert.match(d.id, /^[A-Za-z0-9_-]{1,100}$/);
    const url = new URL(d.source);
    assert.equal(url.protocol, "https:");
    assert.ok(
      ["gate2027.iitm.ac.in", "gate2026.iitg.ac.in"].includes(url.hostname),
    );
    assert.ok(d.bytes > 0 && d.bytes <= 32 * 1024 * 1024);
    if (d.bundled) {
      const bytes = readFileSync(`public/library/${d.id}.pdf`);
      assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
      assert.equal(bytes.length, d.bytes);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), d.sha256);
      assert.ok(d.pages?.length && d.pages.every((p) => p.trim().length > 50));
    }
  }
  const native = JSON.parse(
    readFileSync("public/library/catalog.json", "utf8"),
  );
  assert.deepEqual(
    native,
    library.documents.map(({ pages: _pages, ...d }) => d),
  );
});
test("all branches can persist progress and receive relevant common learning without alias drift", () => {
  assert.equal(paperForBranch("Cybersecurity"), "CS");
  assert.equal(paperForBranch("AIML"), "DA");
  for (const branch of branches) {
    assert.ok(
      syllabus.some((d) => d.code === paperForBranch(branch)),
      branch,
    );
    assert.ok(validProgress({ ...emptyProgress(), branch }), branch);
    assert.ok(getTopics(branch).length >= 2, branch);
  }
  assert.deepEqual(
    getTopics("EC").map((t) => t.id),
    getTopics("ECE").map((t) => t.id),
  );
  assert.ok(!getTopics("XH").some((t) => t.id === "circuits"));
  assert.equal(
    validProgress({ ...emptyProgress(), branch: "Invented paper" }),
    false,
  );
});
