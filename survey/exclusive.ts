export function toggleMulti(
  current: string[] | undefined,
  optionId: string,
  exclusiveId?: string,
  maxNonExclusive?: number,
): string[] {
  const selected = current ?? [];
  const exclusiveOn = exclusiveId != null && selected.includes(exclusiveId);

  if (exclusiveId && optionId === exclusiveId) {
    return exclusiveOn ? [] : [exclusiveId];
  }

  if (exclusiveOn) return selected;

  const rest = exclusiveId ? selected.filter((id) => id !== exclusiveId) : [...selected];
  if (rest.includes(optionId)) return rest.filter((id) => id !== optionId);
  if (maxNonExclusive != null && rest.length >= maxNonExclusive) return rest;
  return [...rest, optionId];
}

export function optionDisabled(
  selected: string[] | undefined,
  optionId: string,
  exclusiveId?: string,
  maxNonExclusive?: number,
): boolean {
  const current = selected ?? [];
  if (exclusiveId && current.includes(exclusiveId)) return optionId !== exclusiveId;
  const others = exclusiveId ? current.filter((id) => id !== exclusiveId) : current;
  if (exclusiveId && optionId === exclusiveId) return others.length > 0;
  if (maxNonExclusive != null && !others.includes(optionId) && others.length >= maxNonExclusive) {
    return true;
  }
  return false;
}
