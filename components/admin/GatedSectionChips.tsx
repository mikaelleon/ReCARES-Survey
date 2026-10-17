'use client';

/**
 * Compact gated-branch tags for table/card rows (live survey v2).
 */
export function GatedSectionChips({
  homeowner,
  tenant,
  accessibility,
  permitsExtended,
  deviceDependent,
  labeled = false,
}: {
  homeowner: boolean;
  tenant: boolean;
  accessibility: boolean;
  permitsExtended: boolean;
  deviceDependent: boolean;
  /** Show the plain-language name instead of the field code (recognition over recall). */
  labeled?: boolean;
}) {
  const chips: { key: string; label: string; name: string; title: string }[] = [];
  if (homeowner) {
    chips.push({ key: 'h', label: 'H', name: 'Homeowner', title: 'Homeowner branch was shown' });
  }
  if (tenant) {
    chips.push({ key: 't', label: 'T', name: 'Tenant', title: 'Tenant / lessee branch was shown' });
  }
  if (accessibility) {
    chips.push({ key: 'ac', label: 'AC', name: 'Accessibility', title: 'Accessibility items were shown' });
  }
  if (permitsExtended) {
    chips.push({ key: 'p', label: 'P+', name: 'Permits', title: 'Permit follow-ups were shown' });
  }
  if (deviceDependent) {
    chips.push({ key: 'b', label: 'B+', name: 'Devices', title: 'Device-dependent digital items were shown' });
  }

  if (chips.length === 0) {
    return <span className="admin-chips__none">None</span>;
  }

  return (
    <ul className="admin-chips">
      {chips.map((c) => (
        <li key={c.key}>
          <span className="admin-chip" title={c.title} aria-label={c.title}>
            {labeled ? c.name : c.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
