import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithPopup, GithubAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5NAsIM2YmvmmbXB27dxfMQ1CCUg7XBCk",
  authDomain: "version2-38369.firebaseapp.com",
  databaseURL: "https://version2-38369-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "version2-38369",
  storageBucket: "version2-38369.firebasestorage.app",
  messagingSenderId: "828991288118",
  appId: "1:828991288118:web:e34209d4e6d55c4db1f997"
};

// Initialize Firebase
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

  get(userRef).then((snapshot) => {
    let scores = snapshot.val() || [];
    scores.push(time);
    set(userRef, scores);
  }).catch((error) => {
    console.error("Error saving time:", error);
  });
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

document.getElementById('login').addEventListener('click', loginWithGithub);