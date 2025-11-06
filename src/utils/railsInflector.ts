/**
 * Rails-compatible singularization utility
 * Based on activesupport/lib/active_support/inflections.rb
 * https://github.com/rails/rails/blob/main/activesupport/lib/active_support/inflections.rb
 */

export function singularize(word: string): string {
  const lower = word.toLowerCase();

  // Uncountable words
  const uncountable = [
    "equipment",
    "information",
    "rice",
    "money",
    "species",
    "series",
    "fish",
    "sheep",
    "jeans",
    "police",
  ];
  if (uncountable.includes(lower)) return word;

  // Irregular forms
  const irregulars: Record<string, string> = {
    people: "person",
    men: "man",
    children: "child",
    sexes: "sex",
    moves: "move",
    zombies: "zombie",
  };
  if (irregulars[lower]) return irregulars[lower];

  // Singular rules (order matters)
  const rules: Array<[RegExp, string]> = [
    [/([^aeiouy]|qu)ies$/i, "$1y"],
    [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)(sis|ses)$/i, "$1sis"],
    [/(^analy)(sis|ses)$/i, "$1sis"],
    [/([^f])ves$/i, "$1fe"],
    [/([lr])ves$/i, "$1f"],
    [/(x|ch|ss|sh)es$/i, "$1"],
    [/^(m|l)ice$/i, "$1ouse"],
    [/(bus)(es)?$/i, "$1"],
    [/(o)es$/i, "$1"],
    [/(shoe)s$/i, "$1"],
    [/(cris|test)(is|es)$/i, "$1is"],
    [/^(a)x[ie]s$/i, "$1xis"],
    [/(octop|vir)(us|i)$/i, "$1us"],
    [/(alias|status)(es)?$/i, "$1"],
    [/^(ox)en/i, "$1"],
    [/(vert|ind)ices$/i, "$1ex"],
    [/(matr)ices$/i, "$1ix"],
    [/(quiz)zes$/i, "$1"],
    [/([ti])a$/i, "$1um"],
    [/(database)s$/i, "$1"],
    [/(ss)$/i, "$1"],
    [/s$/i, ""],
  ];

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }

  return word;
}
