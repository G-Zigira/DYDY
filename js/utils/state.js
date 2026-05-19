// ============================================================
// DYDY AI — App State
// ============================================================

export const state = {
  currentPage:       'home',
  isDark:            true,
  currentUser:       null,
  firebaseReady:     false,
  dydyHistory:       [],
  selectedDate:      null,
  selectedTime:      null,
  selectedMeetType:  'video',
  calendarDate:      new Date(),

  // Firebase function refs (populated by firebase loader)
  fb: {
    auth: null, db: null, signIn: null, signOut: null,
    collection: null, addDoc: null, query: null, where: null,
    orderBy: null, onSnapshot: null, serverTimestamp: null,
    provider: null, doc: null, updateDoc: null,
    ADVISOR_UID: '',
  },

  // Unsubscribe handles
  unsub: {
    messages:      null,
    notifications: null,
  }
};
