// supervisor.js
/*import { auth, db } from './firebase-init.js';
import {
  onAuthStateChanged,
  signOut,
  getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const el = id => document.getElementById(id);

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.href = 'index.html';
    return;
  }

  // verify supervisor claim
  const token = await getIdTokenResult(user);
  if (!token.claims || !token.claims.supervisor) {
    alert('You are not a supervisor.');
    location.href = 'dashboard.html';
    return;
  }

  // load all logs
  const logsRef = collection(db, 'logs');
  const q = query(logsRef, orderBy('date', 'desc'));
  onSnapshot(q, snapshot => {
    const list = el('allLogs');
    list.innerHTML = '';
    const totals = {}; // hours per user
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      totals[d.userId] = (totals[d.userId] || 0) + (d.hours || 0);
      const li = document.createElement('li');
      li.className = 'p-3 border rounded flex justify-between items-start';
      li.innerHTML = `
        <div>
          <div class="font-semibold">${d.event} <span class="text-xs text-gray-500">(${d.date})</span></div>
          <div class="text-sm text-gray-600">${d.email} — ${(d.hours||0).toFixed(2)} hrs</div>
          ${d.proofUrl ? `<div class="mt-2"><a href="${d.proofUrl}" target="_blank" class="text-blue-600 underline">View proof</a></div>` : ''}
        </div>
        <div>
          <button data-id="${docSnap.id}" class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });

    // summary
    const summary = el('summary');
    summary.innerHTML = '';
    Object.entries(totals).forEach(([uid, hrs]) => {
      const card = document.createElement('div');
      card.className = 'p-3 border rounded';
      card.innerHTML = `<div class="text-sm text-gray-600">User ID</div><div class="font-semibold">${uid}</div><div class="text-sm mt-1">Total hours: ${hrs.toFixed(2)}</div>`;
      summary.appendChild(card);
    });

    // attach delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!confirm('Delete this log?')) return;
        await deleteDoc(doc(db, 'logs', id));
      });
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  el('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    location.href = 'index.html';
  });
  el('backBtn').addEventListener('click', () => {
    location.href = 'dashboard.html';
  });
});
