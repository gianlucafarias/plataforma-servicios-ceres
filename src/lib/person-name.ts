function capitalizeWord(value: string): string {
  if (!value) {
    return value;
  }

  const first = value.charAt(0).toLocaleUpperCase('es-ES');
  const rest = value.slice(1).toLocaleLowerCase('es-ES');
  return `${first}${rest}`;
}

export function normalizePersonNamePart(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.split('-').map(capitalizeWord).join('-'))
    .join(' ');
}

export function buildPersonFullName(firstName: string, lastName: string): string {
  return [normalizePersonNamePart(firstName), normalizePersonNamePart(lastName)]
    .filter(Boolean)
    .join(' ')
    .trim();
}
