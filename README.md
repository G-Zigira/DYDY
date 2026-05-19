# DYDY AI — v2.0

> **Votre Conseiller. Amplifié par l'Intelligence.**

---

## Directory Structure

```
dydy-v2/
├── index.html                  ← Entry point (all 5 pages)
│
├── css/
│   ├── tokens.css              ← Design variables (colours, spacing, radius)
│   ├── layout.css              ← Shell, sidebar, topbar, mobile nav, responsive
│   └── components.css          ← All UI components (cards, buttons, forms, chat…)
│
├── js/
│   ├── app.js                  ← App controller: navigation, theme, init
│   ├── utils/
│   │   ├── state.js            ← Single source of truth for app state
│   │   └── helpers.js          ← Shared utility functions
│   ├── services/
│   │   ├── firebase.js         ← Firebase SDK config (fill in your keys here)
│   │   └── auth.js             ← Auth, Firestore listeners, notifications
│   └── pages/
│       ├── messages.js         ← Messages page logic
│       ├── meetings.js         ← Calendar, booking, Firestore notifications
│       └── dydy.js             ← DYDY chatbot (demo mode / AI-ready)
│
└── assets/
    ├── images/
    │   └── dydy-avatar.jpg     ← ⚠️  ADD THIS: the half-human/half-AI portrait
    └── icons/                  ← (optional custom icons — Lucide used by default)
```

---

## Quick Start (Local)

Because the app uses ES Modules (`type="module"`), you **cannot** open
`index.html` directly with `file://`. You need a local server:

```bash
# Option A — Python (no install)
cd dydy-v2
python3 -m http.server 3000
# → open http://localhost:3000

# Option B — Node (npx, no install)
npx serve dydy-v2

# Option C — VS Code
# Install the "Live Server" extension, right-click index.html → Open with Live Server
```

---

## Configuration Checklist

### 1 · Firebase (Messages + Notifications)

Open **`js/services/firebase.js`** and replace every placeholder:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

Get these from: **Firebase Console → Project Settings → Web App → SDK setup**

Then set the advisor UID:

```js
export const ADVISOR_UID = "ADVISOR_FIREBASE_UID_HERE";
```

How to get Handy's UID:
1. Have Handy sign in to the app with his Google account
2. Go to **Firebase Console → Authentication → Users**
3. Copy the UID from the row with his email

### 2 · Firestore Security Rules

In **Firebase Console → Firestore → Rules**, paste:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Booking notifications — anyone can create, only recipient can read/update
    match /notifications/{id} {
      allow create: if true;
      allow read, update: if request.auth != null
                          && request.auth.uid == resource.data.recipientUid;
    }

    // Chat messages — authenticated users only
    match /chats/{chatId}/messages/{msgId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3 · DYDY Avatar Image

The DYDY page expects the half-human / half-AI portrait at:

```
assets/images/dydy-avatar.jpg
```

Place the image there and the avatar ring animation will automatically wrap it.
The CSS already handles loading fallback (shows the bot icon if file is missing).

### 4 · DYDY AI (Chatbot)

Currently in **demo mode** — uses scripted responses, no API key needed.

To connect a real AI model later:
1. Open **`js/pages/dydy.js`**
2. Replace the `getDemoResponse()` call inside `sendDydyMessage()` with a `fetch`
   to your backend endpoint (recommended) or the Anthropic/OpenAI API
3. **Never put an API key directly in client-side JS for a production app** — 
   route requests through a serverless function (Netlify Functions, Vercel, etc.)

---

## Theme System

| Token | Dark mode | Light mode |
|---|---|---|
| `--bg-base` | `#05060a` (near-black) | `#f4f7ff` (off-white) |
| `--gold-400` | `#e2bc6b` | same |
| `--blue-500` | `#1a6ef5` | `#1a6ef5` |
| `--text-primary` | `#f0f4ff` | `#0a0f1e` |

Theme persists in `localStorage` under key `dydy-theme`.

---

## Deployment

Any static host works — no server required.

| Host | Command |
|---|---|
| **Netlify** | Drag & drop the `dydy-v2/` folder at app.netlify.com |
| **Vercel** | `vercel --prod` from inside `dydy-v2/` |
| **GitHub Pages** | Push to a repo, enable Pages from `main` branch root |

---

*DYDY AI v2.0 — Built for Handy Verna · Conseiller Financier Certifié*
