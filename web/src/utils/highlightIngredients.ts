/**
 * Highlights ingredient-related words inside instruction text (for display with v-html).
 * Vue 3 has no filters; use this as a plain function or wrap in a component.
 */

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "each",
  "some",
  "any",
  "diced",
  "chopped",
  "sliced",
  "minced",
  "grated",
  "shredded",
  "thinly",
  "fresh",
  "dried",
  "whole",
  "large",
  "small",
  "medium",
  "optional",
  "oz",
  "lb",
  "can",
  "cup",
  "cups",
  "tsp",
  "tbsp",
]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Terms derived from one foodName (full phrase + meaningful tokens). */
function termsFromFoodName(name: string): string[] {
  const n = name.trim();
  if (n.length < 2) return [];
  const out: string[] = [n];
  for (const raw of n.split(/[\s,/]+/)) {
    const w = raw
      .replace(/^[^a-z0-9]+/gi, "")
      .replace(/[^a-z0-9]+$/gi, "");
    if (w.length < 3) continue;
    if (STOP_WORDS.has(w.toLowerCase())) continue;
    out.push(w);
  }
  return out;
}

/** Dedupe case-insensitively; keep longest spelling for each key. */
function dedupeTerms(terms: string[]): string[] {
  const byLower = new Map<string, string>();
  for (const t of terms) {
    const k = t.toLowerCase();
    const prev = byLower.get(k);
    if (!prev || t.length > prev.length) byLower.set(k, t);
  }
  return [...byLower.values()];
}

function patternForTerm(term: string): string {
  const esc = escapeRegex(term);
  if (/\s/.test(term)) {
    return `(?<![a-zA-Z])${esc}(?![a-zA-Z])`;
  }
  return `\\b${esc}\\b`;
}

function findMatchesForTerm(
  text: string,
  term: string
): Array<{ start: number; end: number; len: number }> {
  const re = new RegExp(patternForTerm(term), "gi");
  const out: Array<{ start: number; end: number; len: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({
      start: m.index,
      end: m.index + m[0].length,
      len: m[0].length,
    });
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number }
): boolean {
  return !(a.end <= b.start || a.start >= b.end);
}

function pickNonOverlapping(
  candidates: Array<{ start: number; end: number; len: number }>
): Array<{ start: number; end: number }> {
  const sorted = [...candidates].sort(
    (a, b) => b.len - a.len || a.start - b.start || a.end - b.end
  );
  const picked: Array<{ start: number; end: number }> = [];
  for (const c of sorted) {
    const { start, end } = c;
    if (picked.some((p) => rangesOverlap(p, { start, end }))) continue;
    picked.push({ start, end });
  }
  picked.sort((a, b) => a.start - b.start);
  return picked;
}

/**
 * Returns HTML-safe string with matched ingredient terms wrapped in <strong class="ingredient-hit">.
 */
export function highlightIngredientsInText(
  text: string,
  foodNames: string[]
): string {
  if (!text?.trim()) return "";
  const escaped = escapeHtml(text);
  const rawTerms = foodNames.flatMap((n) => termsFromFoodName(n));
  const terms = dedupeTerms(rawTerms).sort((a, b) => b.length - a.length);

  const candidates: Array<{ start: number; end: number; len: number }> = [];
  for (const term of terms) {
    for (const m of findMatchesForTerm(escaped, term)) {
      candidates.push(m);
    }
  }

  const picked = pickNonOverlapping(candidates);
  if (picked.length === 0) return escaped;

  let out = "";
  let i = 0;
  for (const { start, end } of picked) {
    out += escaped.slice(i, start);
    out += `<strong class="ingredient-hit">${escaped.slice(start, end)}</strong>`;
    i = end;
  }
  out += escaped.slice(i);
  return out;
}
