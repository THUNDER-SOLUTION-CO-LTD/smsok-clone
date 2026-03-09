/**
 * Variable substitution: {name}, {phone}, {date}, {custom_key}
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in variables) return variables[key];
    return match; // leave unmatched variables as-is
  });
}

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}
