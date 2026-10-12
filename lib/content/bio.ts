/** Placeholder in a bio paragraph that renders the live age. */
export const AGE_TOKEN = "{age}";

/**
 * Splits a bio paragraph on `{age}`. The result alternates text and age
 * slots: render `parts[0]`, the age, `parts[1]`, the age, and so on. A
 * paragraph without the token comes back as a single-item array.
 */
export const splitAge = (paragraph: string): string[] =>
  paragraph.split(AGE_TOKEN);
