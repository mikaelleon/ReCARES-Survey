'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/components/survey/SurveyLanguage';
import { clearDraft } from '@/survey/draft';

/**
 * "Leave the survey" control.
 * - No progress to lose (welcome, consent, thank-you screens): goes straight home.
 * - Mid-survey: asks first, explains that progress is kept on this device, and
 *   offers to erase it for shared devices.
 */
export function LeaveSurvey({ hasProgress }: { hasProgress: boolean }) {
  const t = useT();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const leave = (erase: boolean) => {
    if (erase) clearDraft();
    setOpen(false);
    router.push('/');
  };

  return (
    <>
      <button
        type="button"
        className="survey-leave"
        onClick={() => (hasProgress ? setOpen(true) : router.push('/'))}
      >
        <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
        <span>{t('Leave the survey')}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="survey-dialog"
        aria-labelledby="leave-title"
        aria-describedby="leave-desc"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="survey-dialog__body">
          <h2 id="leave-title" className="survey-dialog__title">
            {t('Leave the survey?')}
          </h2>
          <p id="leave-desc" className="survey-dialog__text">
            {t('Your answers so far are saved on this device. You can come back later and resume where you stopped. Nothing is sent until you submit.')}
          </p>
          <div className="survey-dialog__actions">
            <Button variant="primary" onClick={() => setOpen(false)}>
              {t('Stay and keep answering')}
            </Button>
            <Button variant="secondary" onClick={() => leave(false)}>
              {t('Leave and keep my progress')}
            </Button>
            <button type="button" className="survey-linkbtn" onClick={() => leave(true)}>
              {t('Leave and erase my answers from this device')}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
