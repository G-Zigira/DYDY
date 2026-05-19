// ============================================================
// DYDY AI — Messages Page
// ============================================================
import { state }                 from '../utils/state.js';
import { loadFirebase }          from '../services/auth.js';
import { showToast, escapeHtml, autoResize } from '../utils/helpers.js';

export function init() {
  initMessages();
}

export async function initMessages() {
  await loadFirebase();
  renderMessages();
}

export function renderMessages() {
  const authPrompt = document.getElementById('messages-auth-prompt');
  const content    = document.getElementById('messages-content');
  if (!state.currentUser) {
    if (authPrompt) authPrompt.style.display = 'flex';
    if (content)    content.style.display    = 'none';
    return;
  }
  if (authPrompt) authPrompt.style.display = 'none';
  if (content)    content.style.display    = 'grid';
  loadAdvisorConversation();
}

window.openConversation = function(id) {
  document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
  event?.currentTarget?.classList.add('active');

  const nameEl = document.getElementById('chat-contact-name');
  const msgs   = document.getElementById('chat-messages');

  if (id === 'advisor') {
    if (nameEl) nameEl.textContent = 'Handy Verna';
    loadAdvisorConversation();
  } else {
    const map = {
      'notif-reer': {
        name: 'Rappel REER',
        body: 'Votre contribution REER 2024 est due dans 23 jours. Le plafond est de 18% de votre revenu gagné (max ~31 560$ pour 2024). Handy recommande de planifier dès maintenant pour optimiser votre déduction fiscale.'
      },
      'notif-objectif': {
        name: 'Objectif Maison',
        body: 'Votre épargne pour la maison a progressé de 2% ce mois! Vous êtes à 42% de votre objectif de 125 000$. Continuez sur cette lancée — à ce rythme vous atteignez l\'objectif en 2028.'
      }
    };
    const n = map[id];
    if (n && nameEl) nameEl.textContent = n.name;
    if (n && msgs) msgs.innerHTML = buildMsg(n.body, 'recv');
  }
};

function buildMsg(text, type, time = '') {
  const t = time || new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  const avHtml = type === 'recv'
    ? `<div class="conv-avatar" style="background:linear-gradient(135deg,var(--gold-500),var(--blue-500));width:30px;height:30px;font-size:.75rem;flex-shrink:0;font-weight:700">HV</div>`
    : '';
  return `<div class="msg ${type}">${avHtml}<div><div class="msg-bubble">${escapeHtml(text)}</div><div class="msg-time">${t}${type==='sent'?' · Lu':''}</div></div></div>`;
}

function loadAdvisorConversation() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;

  if (!state.currentUser || !state.firebaseReady) {
    msgs.innerHTML = buildMsg("Bonjour! Je suis Handy Verna, votre conseiller financier. Connectez-vous pour voir vos messages et m'envoyer des questions.", 'recv', '9h30');
    return;
  }

  if (state.unsub.messages) state.unsub.messages();

  const { fb } = state;
  const chatId = [state.currentUser.uid, fb.ADVISOR_UID].sort().join('_');
  const q = fb.query(
    fb.collection(fb.db, 'chats', chatId, 'messages'),
    fb.orderBy('timestamp', 'asc')
  );

  state.unsub.messages = fb.onSnapshot(q, snap => {
    if (snap.empty) {
      msgs.innerHTML = buildMsg("Bonjour! Je suis Handy Verna. Comment puis-je vous aider aujourd'hui?", 'recv', '9h30');
      return;
    }
    msgs.innerHTML = '';
    snap.forEach(docSnap => {
      const d    = docSnap.data();
      const isMe = d.senderId === state.currentUser.uid;
      const time = d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }) : 'Maintenant';
      msgs.innerHTML += buildMsg(d.text, isMe ? 'sent' : 'recv', time);
    });
    msgs.scrollTop = msgs.scrollHeight;
  });
}

window.sendMessage = async function() {
  if (!state.currentUser) { showToast('Connectez-vous pour envoyer des messages', 'error'); return; }
  if (!state.firebaseReady) { showToast('Firebase non configuré', 'error'); return; }

  const input = document.getElementById('chat-input');
  const text  = input?.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';

  const { fb } = state;
  const chatId = [state.currentUser.uid, fb.ADVISOR_UID].sort().join('_');
  try {
    await fb.addDoc(fb.collection(fb.db, 'chats', chatId, 'messages'), {
      text,
      senderId:   state.currentUser.uid,
      senderName: state.currentUser.displayName || 'Client',
      timestamp:  fb.serverTimestamp(),
    });
  } catch (e) { showToast('Erreur: ' + e.message, 'error'); }
};

window.handleChatKey = function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.sendMessage(); }
};
