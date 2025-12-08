// dashboard.js
import { auth, db, storage } from './firebase-init.js';
import {
  signOut,
  onAuthStateChanged,
  getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

const el = id => document.getElementById(id);

async function uploadFile(userId, file) {
  if (!file) return "";
  const path = `proofs/${userId}/${Date.now()}_${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
}

function parseHours(start, end) {
  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);
  const diff = (e - s) / (1000*60*60);
  return diff > 0 ? diff : 0;
}

function weekStartDate(d = new Date()){
  const day = d.getDay(); // 0 sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // monday as start
  return new Date(d.setDate(diff));
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  el('userEmail').textContent = user.email;

  // Check if user is supervisor (show link)
  try {
    const token = await getIdTokenResult(user);
    if (token.claims && token.claims.supervisor) {
      el('supervisorLink').classList.remove('hidden');
    }
  } catch (e) {
    console.warn('token error', e);
  }

  // real-time query for user logs
  const logsRef = collection(db, 'logs');
  const q = query(logsRef, where('userId', '==', user.uid), orderBy('date', 'desc'));
  onSnapshot(q, snapshot => {
    const list = el('logList');
    list.innerHTML = '';
    let total = 0;
    let totalWeek = 0;
    const startOfWeek = weekStartDate(new Date());
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      total += (d.hours || 0);
      // compute week total by comparing date strings (YYYY-MM-DD)
      if (d.date) {
        const logDate = new Date(d.date + 'T00:00:00');
        if (logDate >= startOfWeek) totalWeek += (d.hours || 0);
      }
      const li = document.createElement('li');
      li.className = 'p-3 border rounded flex justify-between items-start gap-3';
      li.innerHTML = `
        <div>
          <div class="font-semibold">${d.event} <span class="text-xs text-gray-500">(${d.date})</span></div>
          <div class="text-sm text-gray-600">${(d.hours||0).toFixed(2)} hrs — ${d.start} to ${d.end}</div>
          ${d.proofUrl ? `<div class="mt-2"><a href="${d.proofUrl}" target="_blank" class="text-blue-600 underline text-sm">View proof</a></div>` : ''}
        </div>
        <div class="text-right">
          <button data-id="${docSnap.id}" class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });

    el('totalAll').textContent = total.toFixed(2);
    el('totalWeek').textContent = totalWeek.toFixed(2);

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

// handlers
document.addEventListener('DOMContentLoaded', () => {
  el('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    location.href = 'index.html';
  });

  el('submitLogBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert('Not authenticated');
    const date = el('date').value;
    const event = el('event').value.trim();
    const start = el('start').value;
    const end = el('end').value;
    const proofFile = el('proof').files[0];
    if (!date || !event || !start || !end) return alert('Please fill all fields');

    const hours = parseHours(start, end);
    let proofUrl = '';
    if (proofFile) {
      proofUrl = await uploadFile(user.uid, proofFile);
    }

    await addDoc(collection(db, 'logs'), {
      userId: user.uid,
      email: user.email,
      date,
      event,
      start,
      end,
      hours,
      proofUrl,
      createdAt: serverTimestamp()
    });

    // clear form
    el('event').value = '';
    el('start').value = '';
    el('end').value = '';
    el('proof').value = '';
  });
});
