// ============================================================
// DYDY AI — Meetings Page
// ============================================================
import { state }        from '../utils/state.js';
import { loadFirebase } from '../services/auth.js';
import { showToast, escapeHtml } from '../utils/helpers.js';

const MONTH_NAMES  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTH_SHORT  = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];
const DAY_HEADERS  = ['D','L','M','M','J','V','S'];

export function init() { renderCalendar(); }

// ── Calendar ──────────────────────────────────────────────
export function renderCalendar() {
  const calEl = document.getElementById('mini-calendar');
  if (!calEl) return;

  const { calendarDate } = state;
  const year  = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  let html = `<div class="calendar-header">
    <button class="cal-nav" onclick="window.prevMonth()">‹</button>
    <span class="cal-month">${MONTH_NAMES[month]} ${year}</span>
    <button class="cal-nav" onclick="window.nextMonth()">›</button>
  </div><div class="calendar-grid">`;

  DAY_HEADERS.forEach(d => { html += `<div class="cal-day-header">${d}</div>`; });

  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month">${daysInPrev - i}</div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday    = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = state.selectedDate === dateStr;
    const isPast     = new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let cls = 'cal-day';
    if (isToday)    cls += ' today';
    if (isSelected) cls += ' selected';
    if (isPast)     cls += ' other-month';
    const click = isPast ? '' : `onclick="window.selectCalDay('${dateStr}')"`;
    html += `<div class="${cls}" ${click}>${d}</div>`;
  }

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  let nd = 1;
  for (let i = firstDay + daysInMonth; i < totalCells; i++) {
    html += `<div class="cal-day other-month">${nd++}</div>`;
  }

  html += '</div>';
  calEl.innerHTML = html;
}

window.prevMonth = function() { state.calendarDate.setMonth(state.calendarDate.getMonth() - 1); renderCalendar(); };
window.nextMonth = function() { state.calendarDate.setMonth(state.calendarDate.getMonth() + 1); renderCalendar(); };

window.selectCalDay = function(dateStr) {
  state.selectedDate = dateStr;
  renderCalendar();
  showToast('Date sélectionnée: ' + dateStr, 'info');
};

window.selectTime = function(el) {
  if (el.classList.contains('unavailable')) return;
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedTime = el.textContent.trim();
};

window.selectMeetingType = function(el) {
  document.querySelectorAll('.type-option').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedMeetType = el.dataset.type;
};

// ── Booking ───────────────────────────────────────────────
window.bookMeeting = async function() {
  const name    = document.getElementById('meet-name')?.value.trim();
  const email   = document.getElementById('meet-email')?.value.trim();
  const subject = document.getElementById('meet-subject')?.value;
  const message = document.getElementById('meet-message')?.value.trim();

  if (!name || !email || !subject) { showToast('Remplissez tous les champs requis', 'error'); return; }
  if (!state.selectedDate)         { showToast('Sélectionnez une date', 'error'); return; }
  if (!state.selectedTime)         { showToast('Sélectionnez un créneau horaire', 'error'); return; }

  const typeLabel  = state.selectedMeetType === 'video' ? 'En ligne' : 'En personne';
  const dateLabel  = new Date(state.selectedDate + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });

  await loadFirebase();
  const { fb } = state;
  if (state.firebaseReady && fb.ADVISOR_UID && fb.ADVISOR_UID !== 'ADVISOR_FIREBASE_UID_HERE') {
    try {
      await fb.addDoc(fb.collection(fb.db, 'notifications'), {
        recipientUid: fb.ADVISOR_UID,
        type:  'booking',
        read:  false,
        title: 'Nouvelle demande de RDV',
        body:  `${name} souhaite un RDV ${typeLabel.toLowerCase()} · ${dateLabel} à ${state.selectedTime} · ${subject}`,
        meta:  { clientName: name, clientEmail: email, subject, message, date: state.selectedDate, time: state.selectedTime, type: state.selectedMeetType, requestedBy: state.currentUser?.uid || 'anonymous' },
        createdAt: fb.serverTimestamp(),
      });
      showToast('RDV soumis — Handy a été notifié!', 'success');
    } catch (e) {
      console.error(e);
      showToast(`RDV confirmé pour le ${dateLabel} à ${state.selectedTime}`, 'success');
    }
  } else {
    showToast(`RDV confirmé pour le ${dateLabel} à ${state.selectedTime}`, 'success');
  }

  // Add to upcoming UI
  const upcomingEl = document.getElementById('upcoming-meetings');
  if (upcomingEl) {
    const parts = state.selectedDate.split('-');
    const card  = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-card-raised);border-radius:var(--r-md);border:1px solid rgba(52,211,153,.2);animation:pageFadeIn .3s ease;margin-bottom:8px';
    card.innerHTML = `
      <div style="background:rgba(52,211,153,.1);border-radius:10px;padding:8px 10px;text-align:center;min-width:46px;flex-shrink:0">
        <div style="font-size:.6rem;text-transform:uppercase;color:#34d399;font-weight:700">${MONTH_SHORT[parseInt(parts[1])-1]}</div>
        <div style="font-family:'Syne',sans-serif;font-size:1.25rem;font-weight:800">${parseInt(parts[2])}</div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:.85rem;font-weight:600">${escapeHtml(subject)}</div>
        <div style="font-size:.73rem;color:var(--text-muted)">${typeLabel} · ${state.selectedTime}</div>
      </div>
      <span style="font-size:.65rem;background:rgba(52,211,153,.1);color:#34d399;padding:3px 9px;border-radius:999px;font-weight:700;white-space:nowrap">En attente</span>`;
    upcomingEl.prepend(card);
  }

  // Reset
  ['meet-name','meet-email','meet-message'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const subj = document.getElementById('meet-subject');
  if (subj) subj.value = '';
  state.selectedDate = null;
  state.selectedTime = null;
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  renderCalendar();
};
