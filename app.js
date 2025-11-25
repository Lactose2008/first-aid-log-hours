// 🔧 Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Theme toggle
function toggleTheme() {
  const root = document.documentElement;
  if (root.classList.contains("dark")) {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

// Check saved theme
if (localStorage.getItem("theme") === "light") {
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
}

// Login
function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => showForm())
    .catch(err => alert(err.message));
}

// Sign up
function signup() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => showForm())
    .catch(err => alert(err.message));
}

// Logout
function logout() {
  auth.signOut();
  document.getElementById("form-section").style.display = "none";
  document.getElementById("login-section").style.display = "block";
}

// Show form after login
function showForm() {
  document.getElementById("form-section").style.display = "block";
  document.getElementById("login-section").style.display = "none";
  document.getElementById("user-email").textContent = auth.currentUser.email;
}

// Submit duty log
async function submitLog() {
  const user = auth.currentUser;
  const date = document.getElementById("date").value;
  const event = document.getElementById("event").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const proofFile = document.getElementById("proof").files[0];

  if (!date || !event || !start || !end) {
    alert("Please fill in all fields!");
    return;
  }

  let proofUrl = "";
  if (proofFile) {
    const storageRef = storage.ref(`proofs/${user.uid}/${proofFile.name}`);
    await storageRef.put(proofFile);
    proofUrl = await storageRef.getDownloadURL();
  }

  const startTime = new Date(`1970-01-01T${start}`);
  const endTime = new Date(`1970-01-01T${end}`);
  const hours = (endTime - startTime) / (1000 * 60 * 60);

  db.collection("logs").add({
    userId: user.uid,
    email: user.email,
    date,
    event,
    start,
    end,
    hours,
    proofUrl
  }).then(() => {
    alert("Duty log saved!");
    loadLogs();
  });
}

// Load logs in real-time
function loadLogs() {
  const user = auth.currentUser;
  db.collection("logs")
    .where("userId", "==", user.uid)
    .orderBy("date", "desc")
    .onSnapshot(snapshot => {
      let total = 0;
      const list = document.getElementById("log-list");
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        total += data.hours;
        const li = document.createElement("li");
        li.innerHTML = `${data.date}: ${data.event} (${data.hours.toFixed(2)} hrs) ${data.proofUrl ? `<a href="${data.proofUrl}" target="_blank" class="text-blue-500 underline">View Proof</a>` : ""}`;
        list.appendChild(li);
      });
      document.getElementById("total-hours").textContent = total.toFixed(2);
    });
}

// Watch auth state
auth.onAuthStateChanged(user => {
  if (user) {
    showForm();
    loadLogs();
  }
});
