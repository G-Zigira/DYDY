// ============================================================
// DYDY AI — Auth & Firebase Service
// ============================================================
import { state }      from '../utils/state.js';
import { showToast, getInitials } from '../utils/helpers.js';

export async function loadFirebase() {
  if (state.firebaseReady) return true;
  try {
    const mod = await import('./firebase.js');
    const fb = state.fb;
    fb.auth            = mod.auth;
    fb.db              = mod.db;
    fb.signIn          = mod.signInWithPopup;
    fb.signOut         = mod.signOut;
    fb.collection      = mod.collection;
    fb.addDoc          = mod.addDoc;
    fb.query           = mod.query;
    fb.where           = mod.where;
    fb.orderBy         = mod.orderBy;
    fb.onSnapshot      = mod.onSnapshot;
    fb.serverTimestamp = mod.serverTimestamp;
    fb.provider        = mod.provider;
    fb.doc             = mod.doc;
    fb.updateDoc       = mod.updateDoc;
    fb.ADVISOR_UID     = mod.ADVISOR_UID;

    mod.onAuthStateChanged(fb.auth, user => {
      state.currentUser = user;
      updateAuthUI(user);
      import('../pages/messages.js').then(m => { if (state.currentPage === 'messages') m.renderMessages(); });
      if (user) startNotificationListener(user.uid);
      else      stopNotificationListener();
    });

    state.firebaseReady = true;
    return true;
  } catch (e) {
    console.warn('[DYDY] Firebase not configured — fill in js/services/firebase.js', e);
    return false;
  }
}

export function updateAuthUI(user) {
  const name     = user ? (user.displayName || user.email?.split('@')[0] || 'Utilisateur') : '';
  const initials = user ? getInitials(user.displayName || name) : '?';

  // ── Topbar: swap login button ↔ user chip ─────────────
  const loggedOut = document.getElementById('topbar-loggedout');
  const loggedIn  = document.getElementById('topbar-loggedin');
  const greeting  = document.getElementById('topbar-greeting');

  if (user) {
    if (loggedOut) loggedOut.style.display = 'none';
    if (loggedIn)  loggedIn.style.display  = 'flex';
    if (greeting)  greeting.innerHTML = `Bonjour,&nbsp;<strong>${name.split(' ')[0]}</strong>`;
  } else {
    if (loggedOut) loggedOut.style.display = 'flex';
    if (loggedIn)  loggedIn.style.display  = 'none';
    if (greeting)  greeting.innerHTML = `Bienvenue sur <strong>DYDY AI</strong>`;
  }

  // Topbar user chip contents
  const topUsername = document.getElementById('topbar-username');
  const topAvatar   = document.getElementById('topbar-avatar');
  if (topUsername) topUsername.textContent = name.split(' ')[0] || '—';
  if (topAvatar) {
    topAvatar.innerHTML = user?.photoURL
      ? `<img src="${user.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
      : initials;
  }

  // Profile page
  const pName   = document.getElementById('profile-name');
  const pEmail  = document.getElementById('profile-email');
  const sName   = document.getElementById('settings-name');
  const sEmail  = document.getElementById('settings-email');
  const pAvLg   = document.getElementById('profile-avatar-large');
  const signBtn = document.getElementById('signout-btn');
  const signinB = document.getElementById('profile-signin-btn');
  const sOutRow = document.getElementById('signout-row');
  const gStatus = document.getElementById('settings-google-status');
  const gBtn    = document.getElementById('settings-google-btn');

  if (user) {
    if (pName)   pName.textContent   = user.displayName || name;
    if (pEmail)  pEmail.textContent  = user.email || '';
    if (sName)   sName.textContent   = user.displayName || name;
    if (sEmail)  sEmail.textContent  = user.email || '';
    if (pAvLg)   pAvLg.innerHTML     = user.photoURL
      ? `<img src="${user.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
      : initials;
    if (signBtn) signBtn.style.display  = 'flex';
    if (signinB) signinB.style.display  = 'none';
    if (sOutRow) sOutRow.style.display  = 'flex';
    if (gStatus) gStatus.textContent    = `Connecté · ${user.email}`;
    if (gBtn)    gBtn.style.display     = 'none';
  } else {
    if (signBtn) signBtn.style.display  = 'none';
    if (signinB) signinB.style.display  = 'flex';
    if (sOutRow) sOutRow.style.display  = 'none';
    if (gStatus) gStatus.textContent    = 'Non connecté';
    if (gBtn)    gBtn.style.display     = 'flex';
  }
}

export async function signInWithGoogle() {
  const ok = await loadFirebase();
  if (!ok) { showToast('Firebase non configuré — voir js/services/firebase.js', 'error'); return; }
  try {
    await state.fb.signIn(state.fb.auth, state.fb.provider);
    // Close login modal if it was open
    document.getElementById('login-modal')?.classList.remove('open');
    showToast('Connexion réussie!', 'success');
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      showToast('Erreur de connexion: ' + e.message, 'error');
    }
  }
}

export async function signOutUser() {
  const ok = await loadFirebase();
  if (!ok) return;
  try {
    await state.fb.signOut(state.fb.auth);
    state.currentUser = null;
    updateAuthUI(null);
    showToast('Déconnexion réussie');
  } catch (e) {
    showToast('Erreur: ' + e.message, 'error');
  }
}

// ── Notification listener ─────────────────────────────────
export function startNotificationListener(uid) {
  if (!state.firebaseReady) return;
  stopNotificationListener();
  const { fb } = state;

  const q = fb.query(
    fb.collection(fb.db, 'notifications'),
    fb.where('recipientUid', '==', uid),
    fb.orderBy('createdAt', 'desc')
  );

  state.unsub.notifications = fb.onSnapshot(q, snapshot => {
    const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderNotifPanel(notifs);
    updateNotifBadge(notifs.filter(n => !n.read).length);
  });
}

export function stopNotificationListener() {
  if (state.unsub.notifications) {
    state.unsub.notifications();
    state.unsub.notifications = null;
  }
}

export function renderNotifPanel(notifs) {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  import('../utils/helpers.js').then(({ timeAgo, escapeHtml }) => {
    const unread = notifs.filter(n => !n.read).length;
    let html = `<div class="notif-header">Notifications <span style="color:var(--text-muted);font-weight:400;font-size:.72rem">${unread > 0 ? unread + ' nouvelle' + (unread > 1 ? 's' : '') : 'Toutes lues'}</span></div>`;

    if (notifs.length === 0) {
      html += '<div style="padding:22px;text-align:center;color:var(--text-muted);font-size:.82rem">Aucune notification</div>';
    } else {
      notifs.slice(0, 8).forEach(n => {
        const t     = n.createdAt ? timeAgo(n.createdAt.seconds * 1000) : 'Maintenant';
        const color = n.read ? 'var(--text-muted)' : (n.type === 'booking' ? 'var(--gold-400)' : 'var(--blue-400)');
        html += `<div class="notif-item" onclick="window.__dydy.handleNotifClick('${n.id}','${n.type||''}')">
          <div class="notif-dot" style="background:${color};opacity:${n.read?'0.3':'1'}"></div>
          <div>
            <div class="notif-body">${escapeHtml(n.body || '')}</div>
            <div class="notif-time">${t}</div>
          </div>
        </div>`;
      });
    }
    panel.innerHTML = html;
  });
}

export function updateNotifBadge(count) {
  ['sidebar-badge', 'mobile-badge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = count; el.style.display = count > 0 ? 'inline' : 'none'; }
  });
}

export async function markNotificationsRead() {
  if (!state.currentUser || !state.firebaseReady) return;
  try {
    const { fb } = state;
    const q = fb.query(
      fb.collection(fb.db, 'notifications'),
      fb.where('recipientUid', '==', state.currentUser.uid),
      fb.where('read', '==', false)
    );
    const snap = await new Promise(res => { const u = fb.onSnapshot(q, s => { u(); res(s); }); });
    await Promise.all(snap.docs.map(d => fb.updateDoc(fb.doc(fb.db, 'notifications', d.id), { read: true })));
  } catch (_) {}
}
