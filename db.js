import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithPopup, GithubAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5NAsIM2YmvmmbXB27dxfMQ1CCUg7XBCk",
  authDomain: "version2-38369.firebaseapp.com",
  databaseURL: "https://version2-38369-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "version2-38369",
  storageBucket: "version2-38369.firebasestorage.app",
  messagingSenderId: "828991288118",
  appId: "1:828991288118:web:e34209d4e6d55c4db1f997"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

function getUserId() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

function saveTime(userId, mode, time) {
  const modeCategories = ['normal', 'wobbly', 'wonky', 'icy'];
  const modeCategory = modeCategories[mode];
  const userRef = ref(database, `users/${userId}/scores/${modeCategory}`);
  const topScoreRef = ref(database, `users/${userId}/topScores/${modeCategory}`);

  get(userRef).then((snapshot) => {
    let scores = snapshot.val() || [];
    scores.push(time);
    set(userRef, scores);

    const topScore = Math.min(...scores);
    set(topScoreRef, topScore);
  }).catch((error) => {
    console.error("Error saving time:", error);
  });
}

function updateLoginButton(username) {
  const loginButton = document.getElementById('login');
  loginButton.textContent = username;
  loginButton.disabled = true;
}

function loginWithGithub() {
  const provider = new GithubAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      const userRef = ref(database, 'users/' + user.uid);

      get(userRef).then((snapshot) => {
        if (!snapshot.exists()) {
          set(userRef, {
            username: user.displayName,
            dateJoined: Date.now(),
            scores: {
              normal: [],
              wobbly: [],
              wonky: [],
              icy: []
            },
            topScores: {
              normal: null,
              wobbly: null,
              wonky: null,
              icy: null
            }
          });
        }
        updateLoginButton(user.displayName);
      });
    })
    .catch((error) => {
      console.error("Error during GitHub login:", error);
    });
}

function handleAuthStateChange() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      const userRef = ref(database, 'users/' + user.uid);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          updateLoginButton(user.displayName);
        }
      });
    }
  });
}

function getTopScores(mode) {
  const modeCategories = ['normal', 'wobbly', 'wonky', 'icy'];
  const modeCategory = modeCategories[mode];
  const scoresRef = ref(database, 'users');

  return get(scoresRef).then((snapshot) => {
    const users = snapshot.val();
    const scores = [];

    for (const userId in users) {
      const user = users[userId];
      if (user.topScores && user.topScores[modeCategory] !== null) {
        scores.push({ username: user.username, score: user.topScores[modeCategory] });
      }
    }

    scores.sort((a, b) => a.score - b.score);
    return scores.slice(0, 10);
  });
}

document.getElementById('login').addEventListener('click', loginWithGithub);

handleAuthStateChange();

export { getUserId, saveTime, updateLoginButton, getTopScores };