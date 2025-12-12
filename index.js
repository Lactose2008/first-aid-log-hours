// index.js
/*import { auth } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const emailEl = () => document.getElementById('email');
const passEl = () => document.getElementById('password');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
      await signInWithEmailAndPassword(auth, emailEl().value, passEl().value);
      // redirect to dashboard
      location.href = 'dashboard.html';
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById('signupBtn').addEventListener('click', async () => {
    try {
      await createUserWithEmailAndPassword(auth, emailEl().value, passEl().value);
      // new users get default role via Cloud Function or admin; redirect
      location.href = 'dashboard.html';
    } catch (e) {
      alert(e.message);
    }
  });

  // if already logged in, go to appropriate page
  onAuthStateChanged(auth, user => {
    if (user) {
      // If the user is a supervisor we could redirect later but for simplicity go to dashboard.
      location.href = 'dashboard.html';
    }
  });
});
