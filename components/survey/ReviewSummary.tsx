'use client';

import { Button } from '@/components/ui/Button';
import { buildReviewSections } from '@/survey/review';
import type { SurveyAnswers } from '@/survey/schema';

export function ReviewSummary({
  answers,
  onEdit,
}: {
  answers: Partial<SurveyAnswers>;
  onEdit: (stepNumber: number) => void;
}) {
  const sections = buildReviewSections(answers);

  return (
    <div className="survey-questions">
      <div className="survey-card">
        <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
          The summary below shows what you answered. If you&apos;re using a shared or public device,
          make sure no one else can see this screen before you submit.
        </p>
      </div>
      {sections.map((section) => (
        <div key={section.sectionCode} className="survey-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'baseline',
            }}
          >
            <h2 className="na-q" style={{ marginBottom: 0 }}>
              {section.sectionCode}. {section.title}
            </h2>
            <Button variant="secondary" size="sm" onClick={() => onEdit(section.stepNumber)}>
              Edit
            </Button>
          </div>
          {section.items.map((item) => (
            <div
              key={item.code}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
                gap: 12,
                padding: '10px 0',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 10,
              }}
            >
              <div style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--text-caption)' }}>{item.question}</div>
              <div style={{ fontSize: 15, lineHeight: 1.45, color: 'var(--text-body)', fontWeight: 700 }}>
                {item.answer}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
