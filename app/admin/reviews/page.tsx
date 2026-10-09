'use client';

import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { ReviewInbox } from '@/components/admin/reviews/ReviewInbox';
import styles from '@/components/admin/reviews/reviews.module.css';

function ReviewsContent() {
  return (
    <section className={`dash-page ${styles.page}`} aria-labelledby="reviews-title">
      <div className="dash-page__header">
        <div>
          <h1 id="reviews-title" className="dash-page__title">
            Reviews
          </h1>
          <p className={styles.intro}>
            Advisers comment on a finding note, a survey question, or the instrument. Proponents
            reply and mark a thread addressed. Only an adviser can resolve or reopen it.
          </p>
        </div>
      </div>
      <ReviewInbox />
    </section>
  );
}

export default function AdminReviewsPage() {
  return (
    <AdminAppShell>
      <ReviewsContent />
    </AdminAppShell>
  );
}
