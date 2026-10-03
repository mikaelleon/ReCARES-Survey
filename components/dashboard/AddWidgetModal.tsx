'use client';

import { useEffect } from 'react';
import { BarChart3, PieChart, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  SUMMARY_WIDGET_CATALOG,
  type SummaryWidgetMeta,
} from '@/lib/admin/summaryWidgets';

/**
 * Modal to pin/unpin Summary charts for the current admin only.
 */
export function AddWidgetModal({
  open,
  selectedIds,
  onClose,
  onToggle,
}: {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const selected = new Set(selectedIds);

  return (
    <div className="widget-modal-root" role="presentation">
      <button type="button" className="widget-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="widget-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="widget-modal-title"
      >
        <header className="widget-modal__head">
          <div>
            <h2 id="widget-modal-title" className="widget-modal__title">
              Add widget
            </h2>
            <p className="widget-modal__lead">
              Pin charts to your Summary view. Choices save to your admin profile only.
            </p>
          </div>
          <button type="button" className="widget-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </header>
        <ul className="widget-modal__grid">
          {SUMMARY_WIDGET_CATALOG.map((item) => (
            <WidgetPickCard
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onToggle={() => onToggle(item.id)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function WidgetPickCard({
  item,
  selected,
  onToggle,
}: {
  item: SummaryWidgetMeta;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = item.kind === 'pie' ? PieChart : BarChart3;
  return (
    <li className={`widget-pick${selected ? ' is-selected' : ''}`}>
      <div className="widget-pick__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={2.1} />
      </div>
      <div className="widget-pick__body">
        <h3 className="widget-pick__title">{item.title}</h3>
        <p className="widget-pick__desc">{item.description}</p>
        <span className="widget-pick__tag">#{item.tag}</span>
      </div>
      <Button variant={selected ? 'secondary' : 'primary'} size="sm" onClick={onToggle}>
        {selected ? 'Remove' : 'Select'}
      </Button>
    </li>
  );
}
