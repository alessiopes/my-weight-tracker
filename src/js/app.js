// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyCKAbbPLTsYu6v5SUnaUXQHfXroqilZU_M",
  authDomain: "my-weight-tracker-c7902.firebaseapp.com",
  projectId: "my-weight-tracker-c7902",
  storageBucket: "my-weight-tracker-c7902.appspot.com",
  messagingSenderId: "623317380138",
  appId: "1:623317380138:web:fb4cf10e607c09f54a2753",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Helper function to format usernames
function formatUsername(username) {
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
}

// Function to save or update user profile
async function saveUserProfile(username, targetWeight, finalReward) {
  const formattedUsername = formatUsername(username); // Formatta il nome utente
  localStorage.setItem("username", formattedUsername); // Salva il nome utente in localStorage

  try {
    const userRef = db.collection("users").doc(formattedUsername);
    const doc = await userRef.get(); // Controlla se l'utente esiste già

    if (doc.exists) {
      // Aggiorna l'utente esistente
      await userRef.update({
        targetWeight: parseFloat(targetWeight),
        finalReward,
      });
      alert("Profilo aggiornato con successo!");
    } else {
      // Crea un nuovo utente se non esiste
      await userRef.set({
        username: formattedUsername,
        targetWeight: parseFloat(targetWeight),
        finalReward,
        weights: [],
      });
      alert("Nuovo profilo creato con successo!");
    }
    window.location.reload(); // Ricarica la pagina per aggiornare l'interfaccia utente
  } catch (error) {
    console.error("Errore nel salvataggio del profilo utente:", error);
    alert("Impossibile salvare il profilo. Riprova.");
  }
}

// Retrieve and display user profile data
async function displayUserProfile() {
  const username = localStorage.getItem("username");
  if (username) {
    try {
      const doc = await db.collection("users").doc(username).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("username").value = username;
        document.getElementById("target-weight").value =
          data.targetWeight || "";
        document.getElementById("final-reward").value = data.finalReward || "";
      }
    } catch (error) {
      console.error("Error retrieving user profile:", error);
    }
  }
}

// Save daily weight entry
async function saveDailyWeight(username, weight) {
  const formattedUsername = formatUsername(username);
  const date = new Date().toISOString().split("T")[0];
  try {
    await db
      .collection("users")
      .doc(formattedUsername)
      .update({
        weights: firebase.firestore.FieldValue.arrayUnion({
          date: date,
          weight: parseFloat(weight),
        }),
      });
    alert("Weight saved successfully!");
  } catch (error) {
    console.error("Error saving weight:", error);
    alert("Failed to save weight. Please try again.");
  }
}

// Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Set up profile data on page load
  displayUserProfile();

  // Set up form event listeners
  document
    .getElementById("profile-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const targetWeight = document.getElementById("target-weight").value;
      const finalReward = document.getElementById("final-reward").value;
      await saveUserProfile(username, targetWeight, finalReward);
    });

  document
    .getElementById("weight-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = localStorage.getItem("username");
      const weight = document.getElementById("weight").value;
      if (username && weight) {
        await saveDailyWeight(username, weight);
      }
    });

  document
    .getElementById("reward-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = localStorage.getItem("username");
      const rewardWeight = document.getElementById("reward-weight").value;
      const rewardDescription =
        document.getElementById("reward-description").value;
      addReward(username, rewardWeight, rewardDescription);
    });

  document
    .getElementById("setup-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const targetWeight = document.getElementById("target-weight").value;
      const finalReward = document.getElementById("final-reward").value;
      if (username && targetWeight && finalReward) {
        await saveUserProfile(username, targetWeight, finalReward);
      } else {
        alert("Assicurati di compilare tutti i campi richiesti.");
      }
    });
});

// Add reward to the user profile
async function addReward(username, rewardWeight, rewardDescription) {
  const formattedUsername = formatUsername(username);
  try {
    await db
      .collection("users")
      .doc(formattedUsername)
      .update({
        rewards: firebase.firestore.FieldValue.arrayUnion({
          rewardWeight: parseFloat(rewardWeight),
          rewardDescription,
        }),
      });
    alert("Reward added successfully!");
  } catch (error) {
    console.error("Error adding reward:", error);
    alert("Failed to add reward. Please try again.");
  }
}
