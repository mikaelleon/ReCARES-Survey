'use client';

/**
 * Compact gated-section tags for table/card rows.
 */
export function GatedSectionChips({
  ext,
  s4,
  s5,
  s7a,
  s7b,
}: {
  ext: boolean;
  s4: boolean;
  s5: boolean;
  s7a: boolean;
  s7b: boolean;
}) {
  const chips: { key: string; label: string; sensitive?: boolean; title: string }[] = [];
  if (ext) {
    chips.push({
      key: 'ext',
      label: '3ext',
      title: 'Section 3 extended was shown',
    });
  }
  if (s4) {
    chips.push({
      key: 's4',
      label: '4',
      sensitive: true,
      title: 'Section 4 (household and personal safety) was shown — sensitive gate',
    });
  }
  if (s5) {
    chips.push({
      key: 's5',
      label: '5',
      title: 'Section 5 (children and youth safety) was shown',
    });
  }
  if (s7a) {
    chips.push({
      key: 's7a',
      label: '7a',
      title: 'Section 7a (own accessibility needs) was shown',
    });
  }
  if (s7b) {
    chips.push({
      key: 's7b',
      label: '7b',
      title: 'Section 7b (household accessibility) was shown',
    });
  }

  if (chips.length === 0) {
    return <span className="admin-chips__none">None</span>;
  }

  return (
    <ul className="admin-chips">
      {chips.map((c) => (
        <li key={c.key}>
          <span
            className={`admin-chip${c.sensitive ? ' admin-chip--sensitive' : ''}`}
            title={c.title}
            aria-label={c.title}
          >
            {c.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
