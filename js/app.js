// ============================================================
// DYDY AI — App Controller (navigation, theme, init)
// ============================================================
import { state }           from './utils/state.js';
import { loadFirebase, signInWithGoogle, signOutUser, markNotificationsRead } from './services/auth.js';
import { showToast, formatFrenchDate } from './utils/helpers.js';

// ── Lazy-load page modules ────────────────────────────────
const pageModules = {
  messages: () => import('./pages/messages.js'),
  meetings: () => import('./pages/meetings.js'),
  dydy:     () => import('./pages/dydy.js'),
};

// ── Navigation ────────────────────────────────────────────
export function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('[data-page]').forEach(n => n.classList.remove('active'));

  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(e => e.classList.add('active'));

  state.currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pageModules[page]) {
    pageModules[page]().then(mod => { if (mod.init) mod.init(); });
  }
}

// ── Theme ─────────────────────────────────────────────────
export function toggleTheme() {
  state.isDark = !state.isDark;
  const theme = state.isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dydy-theme', theme);

  const label       = document.getElementById('theme-label');
  const topIcon     = document.getElementById('theme-icon-top');
  const profileTog  = document.getElementById('profile-theme-toggle');

  if (label)      label.textContent = state.isDark ? 'Mode Clair' : 'Mode Sombre';
  if (topIcon)    topIcon.innerHTML = state.isDark ? sunIcon() : moonIcon();
  if (profileTog) profileTog.classList.toggle('on', state.isDark);

  // Swap sidebar icon too
  const sideIcon = document.getElementById('theme-sidebar-icon');
  if (sideIcon) sideIcon.innerHTML = state.isDark ? sunIcon() : moonIcon();
}

const sunIcon  = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
const moonIcon = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;

// ── Init ──────────────────────────────────────────────────
function init() {
  // Restore saved theme
  const saved = localStorage.getItem('dydy-theme') || 'dark';
  state.isDark = saved === 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const profileTog = document.getElementById('profile-theme-toggle');
  if (profileTog) profileTog.classList.toggle('on', state.isDark);

  // Set home date
  const dateEl = document.getElementById('home-date');
  if (dateEl) dateEl.textContent = formatFrenchDate();

  // Sidebar nav listeners
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page));
  });

  // Theme buttons
  document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-btn-top')?.addEventListener('click', toggleTheme);

  // Notification bell
  const notifBtn   = document.getElementById('notif-btn');
  const notifPanel = document.getElementById('notif-panel');
  notifBtn?.addEventListener('click', e => {
    e.stopPropagation();
    notifPanel?.classList.toggle('open');
    if (notifPanel?.classList.contains('open')) markNotificationsRead();
  });
  document.addEventListener('click', e => {
    if (notifPanel && !notifPanel.contains(e.target) && e.target !== notifBtn) {
      notifPanel.classList.remove('open');
    }
  });

  // Google auth buttons
  document.getElementById('google-signin-btn')?.addEventListener('click', signInWithGoogle);

  // Kick off Firebase silently
  loadFirebase().catch(() => {});

  // Expose globals for inline onclick handlers (ES module scope limitation)
  window.__dydy = {
    navigate,
    toggleTheme,
    signInWithGoogle,
    signOutUser,
    handleNotifClick: (id, type) => {
      notifPanel?.classList.remove('open');
      if (type === 'booking') navigate('meetings');
      else if (type === 'message') navigate('messages');
    },
  };

  // Also keep bare globals for onclick="" in HTML
  window.navigate         = navigate;
  window.toggleTheme      = toggleTheme;
  window.signInWithGoogle = signInWithGoogle;
  window.signOutUser      = signOutUser;

  // startDydyChat is defined in dydy.js but called from home page HTML chips.
  // We expose a stub here that lazy-loads the dydy module then calls through.
  window.startDydyChat = function(text) {
    navigate('dydy');
    // Small delay so the page transition completes before sending
    setTimeout(() => {
      import('./pages/dydy.js').then(() => {
        if (typeof window.sendDydyMessage === 'function') window.sendDydyMessage(text);
      });
    }, 350);
  };

  console.log('%cDYDY AI %cv2.0', 'color:#d4a943;font-weight:900;font-size:1.2rem', 'color:#60a5fa;font-weight:600');
}

document.addEventListener('DOMContentLoaded', init);
