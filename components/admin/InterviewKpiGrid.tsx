'use client';

import {
  CalendarCheck,
  Clock3,
  Laptop,
  Mail,
  MessageCircle,
  Users,
  MapPin,
} from 'lucide-react';
import type { InterviewKpis } from '@/lib/admin/interviewAnalytics';

/**
 * Interview Invites KPI strip — pipeline + form-field highlights.
 */
export function InterviewKpiGrid({
  kpis,
  loading = false,
}: {
  kpis: InterviewKpis;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="dash-stat-grid iv-kpi-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dash-stat dash-stat--skeleton" />
        ))}
      </div>
    );
  }

  const empty = kpis.total === 0;

  return (
    <div className="iv-kpi-stack">
      <div className="dash-stat-grid iv-kpi-grid">
        <div className="dash-stat dash-stat--hero">
          <div className="dash-stat__top">
            <span className="dash-stat__icon" aria-hidden="true">
              <Users size={18} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Total Invites</div>
          </div>
          <div className="dash-stat__value">{empty ? <span className="dash-stat__empty">—</span> : kpis.total}</div>
          <div className="dash-stat__caption">
            {empty ? 'No interview interest yet' : 'From the interview invite form'}
          </div>
        </div>

        <div className="dash-stat dash-stat--neutral">
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
              <Mail size={18} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Not Contacted</div>
          </div>
          <div className="dash-stat__value">
            {empty ? <span className="dash-stat__empty">—</span> : kpis.notContacted}
          </div>
          <div className="dash-stat__caption">Awaiting first outreach</div>
        </div>

        <div className="dash-stat dash-stat--neutral">
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
              <MessageCircle size={18} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Pending Confirmation</div>
          </div>
          <div className="dash-stat__value">
            {empty ? <span className="dash-stat__empty">—</span> : kpis.pending}
          </div>
          <div className="dash-stat__caption">Contacted — awaiting reply</div>
        </div>

        <div className="dash-stat dash-stat--neutral">
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
              <CalendarCheck size={18} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Confirmed</div>
          </div>
          <div className="dash-stat__value">
            {empty ? <span className="dash-stat__empty">—</span> : kpis.confirmed}
          </div>
          <div className="dash-stat__caption">Scheduled with resident</div>
        </div>
      </div>

      <div className="dash-stat-grid iv-kpi-grid iv-kpi-grid--form">
        <div className="dash-stat dash-stat--metric">
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
              <Laptop size={16} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Online</div>
          </div>
          <div className="dash-stat__value">
            {empty ? <span className="dash-stat__empty">—</span> : kpis.online}
          </div>
          <div className="dash-stat__caption">Preferred format</div>
        </div>

        <div className="dash-stat dash-stat--metric">
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
              <MapPin size={16} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Face-to-face</div>
          </div>
          <div className="dash-stat__value">
            {empty ? <span className="dash-stat__empty">—</span> : kpis.faceToFace}
          </div>
          <div className="dash-stat__caption">Dear Joe location</div>
        </div>

        <div className="dash-stat dash-stat--metric">
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
              <CalendarCheck size={16} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Top Preferred Day</div>
          </div>
          <div className="dash-stat__value dash-stat__value--text">
            {kpis.topDay ? kpis.topDay.label : <span className="dash-stat__empty">—</span>}
          </div>
          <div className="dash-stat__caption">
            {kpis.topDay ? `${kpis.topDay.count} invite${kpis.topDay.count === 1 ? '' : 's'}` : 'No day preference yet'}
          </div>
        </div>

        <div className="dash-stat dash-stat--metric">
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
              <Clock3 size={16} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Top Time Window</div>
          </div>
          <div className="dash-stat__value dash-stat__value--text">
            {kpis.topTime ? kpis.topTime.label : <span className="dash-stat__empty">—</span>}
          </div>
          <div className="dash-stat__caption">
            {kpis.topTime
              ? `${kpis.topTime.count} invite${kpis.topTime.count === 1 ? '' : 's'}`
              : 'No time preference yet'}
          </div>
        </div>
      </div>
    </div>
  );
}
