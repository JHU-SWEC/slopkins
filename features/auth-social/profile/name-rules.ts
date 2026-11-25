// Blocks offensive and official-sounding usernames and display names.
// Used by the edit form (instant message) and the server (the real check).
//
// The word list comes from the `obscenity` package (racial slurs, derogatory
// terms, sexual terms, profanity), so this file doesn't contain the words
// themselves. To add a term, use `.addPhrase` on the dataset below; to allow
// one, use `.removePhrasesIf`. See https://github.com/jo3-l/obscenity.
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// Terms from the list that also appear inside ordinary English words
// (e.g. "ass" in "class", "tit" in "title", "cum" in "document"). These are
// still blocked as standalone words, just not when buried inside a longer word.
// Found by checking every term against the macOS English dictionary.
const ALSO_INSIDE_NORMAL_WORDS = new Set([
  "abo", "anal", "anus", "arse", "ass", "bastard", "boob", "cock", "cuck", "cum",
  "cunt", "dick", "ejaculate", "hooker", "orgy", "penis", "piss", "porn", "prick",
  "rape", "scat", "semen", "sex", "shit", "slut", "spastic", "tit", "turd", "twat",
  "vagina", "wank",
]);

// Every other term is blocked anywhere in a name, even glued to other text
// ("xx" + term + "99").
const BLOCKED_ANYWHERE: string[] = (() => {
  const terms = new Set<string>();
  englishDataset.removePhrasesIf((phrase) => {
    const word = phrase.metadata?.originalWord;
    if (word && !ALSO_INSIDE_NORMAL_WORDS.has(word)) terms.add(word);
    return false; // only reading the list, not changing it
  });
  return [...terms].filter((term) => term.length >= 3);
})();

// Names that could pass for staff or an official account.
const RESERVED_EXACT = new Set([
  "admin", "administrator", "mod", "moderator", "moderators", "slopkins", "support",
  "help", "official", "staff", "team", "security", "system", "root", "jhu",
  "hopkins", "johnshopkins", "jhuofficial", "null", "undefined", "anonymous",
]);
const RESERVED_ANYWHERE = ["slopkins", "admin", "moderator", "official"];

// Undo number/symbol swaps people use to sneak words past filters.
const LOOKALIKES: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g",
  "@": "a", "$": "s", "!": "i", "|": "i", "+": "t",
};

/** Lowercase, undo lookalikes, and drop everything that isn't a letter. */
function squash(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // é -> e
    .replace(/[013457895@$!|+]/g, (c) => LOOKALIKES[c] ?? c)
    .replace(/[^a-z]/g, "");
}

// Ordinary words (lots of them food) that contain a blocked term by accident.
// They're removed before checking, so "cumin_lover" is fine.
const ALWAYS_ALLOWED = ["cumin", "shiitake", "shitake", "assort", "scunthorpe", "cockscomb"];

function isOffensive(rawText: string): boolean {
  let text = rawText.toLowerCase();
  for (const word of ALWAYS_ALLOWED) text = text.replaceAll(word, " ");
  const spaced = text.replace(/[_.\-]+/g, " "); // "big_word_99" -> "big word 99"
  const joined = text.replace(/[\s_.\-]+/g, ""); // "w_o_r_d" -> "word"
  if (matcher.hasMatch(spaced) || matcher.hasMatch(joined)) return true;
  const squashed = squash(text);
  return BLOCKED_ANYWHERE.some((term) => squashed.includes(term));
}

function isReserved(text: string): boolean {
  const letters = text.toLowerCase().replace(/[^a-z]/g, "");
  return RESERVED_EXACT.has(letters) || RESERVED_ANYWHERE.some((word) => letters.includes(word));
}

/**
 * Why a username or display name isn't allowed, or null if it's fine.
 * The message never repeats the word back.
 */
export function nameProblem(text: string, kind: "username" | "display name"): string | null {
  if (!text.trim()) return null;
  // Auto-generated placeholders like "user_5acf5a3af2f7" are always fine.
  if (/^user_[0-9a-f]{12}$/.test(text)) return null;
  if (isOffensive(text)) {
    return `That ${kind} isn't allowed on Slopkins. Please choose something else.`;
  }
  if (isReserved(text)) {
    return `That ${kind} is reserved. Please choose something else.`;
  }
  return null;
}
