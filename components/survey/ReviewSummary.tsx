'use client';

import { Button } from '@/components/ui/Button';
import { useT } from '@/components/survey/SurveyLanguage';
import { buildReviewSections } from '@/survey/review';
import type { SurveyAnswers } from '@/survey/schema';

export function ReviewSummary({
  answers,
  onEdit,
}: {
  answers: Partial<SurveyAnswers>;
  onEdit: (stepNumber: number) => void;
}) {
  const t = useT();
  const sections = buildReviewSections(answers);

  return (
    <div className="survey-questions">
      <div className="survey-card">
        <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
          {t("The summary below shows what you answered. If you're using a shared or public device, make sure no one else can see this screen before you submit.")}
        </p>
      </div>
      {sections.map((section) => (
        <div key={section.sectionCode} className="survey-card">
          <div className="survey-review-head">
            <h2 className="na-q" style={{ marginBottom: 0 }}>
              {section.sectionCode}. {t(section.title)}
            </h2>
            <Button variant="secondary" size="sm" onClick={() => onEdit(section.stepNumber)}>
              {t('Edit')}
            </Button>
          </div>
          {section.items.map((item) => (
            <div key={item.code} className="survey-review-row">
              <div className="survey-review-row__q">{t(item.question)}</div>
              <div className="survey-review-row__a">
                {t(item.answer)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
