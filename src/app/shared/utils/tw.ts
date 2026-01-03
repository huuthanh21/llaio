/**
 * A "tag" function for template literals.
 * It does nothing at runtime (returns the string as-is),
 * but tells Prettier that the string contains Tailwind classes.
 */
export const tw = (strings: TemplateStringsArray, ...values: unknown[]) =>
  String.raw({ raw: strings }, ...values);
