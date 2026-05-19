// ============================================================
// DYDY AI — DYDY Chatbot Page
// DYDY_AVATAR_PATH: set to your actual avatar image path when ready.
// Demo mode uses scripted responses; swap in an API call later.
// ============================================================
import { state }                from '../utils/state.js';
import { formatMarkdown, escapeHtml, autoResize } from '../utils/helpers.js';

// Path to the half-human / half-AI portrait shown in the mockup.
// Replace with the actual asset once you have it.
export const DYDY_AVATAR_PATH = 'assets/images/dydy-avatar.jpg';

export function init() {
  // Nothing to re-init unless chat was cleared
}

// ── Message builders ──────────────────────────────────────
function buildAiMsg(text) {
  const imgSrc = DYDY_AVATAR_PATH;
  const avatarHtml = `
    <div class="ai-msg-avatar-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
        <circle cx="12" cy="16" r="1"/>
      </svg>
    </div>`;
  return `<div class="ai-msg">${avatarHtml}<div class="ai-bubble">${formatMarkdown(text)}</div></div>`;
}

function buildUserMsg(text, initials = 'U') {
  return `<div class="user-msg"><div class="conv-avatar" style="background:linear-gradient(135deg,var(--gold-500),var(--blue-500));width:30px;height:30px;font-size:.7rem;font-weight:700;flex-shrink:0">${initials}</div><div class="user-bubble">${escapeHtml(text)}</div></div>`;
}

const typingHtml = () => `
  <div class="ai-msg" id="dydy-typing">
    <div class="ai-msg-avatar-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
        <circle cx="12" cy="16" r="1"/>
      </svg>
    </div>
    <div class="typing-indicator">
      <div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div>
    </div>
  </div>`;

// ── Send message ──────────────────────────────────────────
window.sendDydyMessage = async function(text) {
  if (!text?.trim()) return;
  const msgs       = document.getElementById('dydy-messages');
  const chips      = document.getElementById('dydy-chips');
  const sendBtn    = document.getElementById('dydy-send-btn');
  if (!msgs) return;
  if (chips) chips.style.display = 'none';

  const initials = state.currentUser
    ? (state.currentUser.displayName || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
    : 'U';

  msgs.innerHTML += buildUserMsg(text, initials);
  msgs.innerHTML += typingHtml();
  msgs.scrollTop = msgs.scrollHeight;

  state.dydyHistory.push({ role: 'user', content: text });
  if (sendBtn) sendBtn.disabled = true;

  await new Promise(r => setTimeout(r, 900 + Math.random() * 700));

  const ai = getDemoResponse(text);
  state.dydyHistory.push({ role: 'assistant', content: ai });

  document.getElementById('dydy-typing')?.remove();
  msgs.innerHTML += buildAiMsg(ai);
  msgs.scrollTop = msgs.scrollHeight;
  if (sendBtn) sendBtn.disabled = false;
  document.getElementById('dydy-input')?.focus();
};

window.sendDydyFromInput = function() {
  const input = document.getElementById('dydy-input');
  const text  = input?.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  window.sendDydyMessage(text);
};

window.handleDydyKey = function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.sendDydyFromInput(); }
};

window.clearDydyChat = function() {
  state.dydyHistory = [];
  const msgs = document.getElementById('dydy-messages');
  if (msgs) msgs.innerHTML = buildAiMsg("Bonjour! Je suis DYDY, votre assistant financier IA. Comment puis-je vous aider aujourd'hui?");
  const chips = document.getElementById('dydy-chips');
  if (chips) chips.style.display = 'flex';
};

window.startDydyChat = function(text) {
  import('../app.js').then(m => { m.navigate('dydy'); setTimeout(() => window.sendDydyMessage(text), 350); });
};

// ── Demo responses ────────────────────────────────────────
function getDemoResponse(text) {
  const t = text.toLowerCase();
  if (t.includes('reer')) return "Le REER (Régime Enregistré d'Épargne-Retraite) est un compte d'épargne à avantages fiscaux au Canada.\n\n**Points clés:**\n\n• **Plafond 2024:** 18% du revenu gagné (max ~31 560$)\n• **Avantage immédiat:** Déduction de votre revenu imposable\n• **Croissance à l'abri:** Vos placements fructifient sans impôt\n• **Date limite:** 60 jours après le 31 décembre\n\nPour maximiser votre REER selon votre situation, je recommande de **prendre un RDV** avec Handy.";
  if (t.includes('celi')) return "Le CELI (Compte d'Épargne Libre d'Impôt) est l'un des meilleurs outils d'épargne canadiens!\n\n**Avantages:**\n\n• **Zéro impôt** sur les gains et les retraits\n• **Plafond cumulatif 2024:** ~95 000$ si vous n'avez jamais cotisé\n• **Flexibilité totale:** Retirez quand vous voulez, droits récupérés l'année suivante\n\nIdéal en complément du REER pour les revenus à la retraite ou les projets à moyen terme.";
  if (t.includes('assurance') || t.includes('famille') || t.includes('protéger')) return "Protéger votre famille est essentiel! Voici les principales options:\n\n• **Assurance vie temporaire** — Protection abordable pour une période définie\n• **Assurance vie permanente** — Protection à vie avec valeur de rachat\n• **Assurance invalidité** — Remplace 60-70% de votre revenu si vous ne pouvez plus travailler\n• **Assurance maladies graves** — Versement forfaitaire en cas de maladie grave\n\nLe bon choix dépend de votre situation familiale et financière. **Handy peut faire une analyse complète** pour vous.";
  if (t.includes('retraite')) return "La planification de la retraite — plus tôt vous commencez, mieux c'est!\n\n**Stratégie recommandée:**\n\n1. Maximisez le REER chaque année\n2. Utilisez le CELI pour la flexibilité\n3. Investissez régulièrement (intérêts composés)\n4. Diversifiez: FNB, actions, obligations\n\n**Règle générale:** Épargnez 10-15% de votre revenu. À 30 ans, 500$/mois à 7% de rendement = plus de 1M$ à 65 ans.\n\nVoulez-vous qu'on analyse votre situation avec Handy?";
  if (t.includes('rdv') || t.includes('rendez') || t.includes('rencontre')) return "Bien sûr! Pour planifier un rendez-vous avec Handy Verna, rendez-vous dans l'onglet **Rendez-vous** de l'application.\n\nVous pouvez choisir:\n• **En ligne** (Zoom ou Teams)\n• **En personne** au bureau de Handy\n\nSélectionnez une date et un créneau disponible — Handy sera notifié automatiquement!";
  if (t.includes('celiapp') || t.includes('maison') || t.includes('achat')) return "Le **CELIAPP** (Compte d'Épargne Libre d'Impôt pour l'Achat d'une Première Propriété) est un outil puissant!\n\n• **Plafond annuel:** 8 000$ (max 40 000$ à vie)\n• **Double avantage:** Déduction comme le REER + retraits libres d'impôt comme le CELI\n• **Conditions:** Premier acheteur, résidence principale au Canada\n\nCombinez le CELIAPP avec votre RAP (REER) pour maximiser votre mise de fonds!";
  return "C'est une excellente question! Pour vous donner le meilleur conseil personnalisé, je vous encourage à:\n\n1. **Poser votre question directement à Handy** via la page Messages\n2. **Prendre un RDV** pour une analyse complète de votre situation\n\nJe peux aussi vous aider avec: **REER, CELI, CELIAPP, Assurance vie, Retraite, Dettes.** Quel sujet vous intéresse?";
}
