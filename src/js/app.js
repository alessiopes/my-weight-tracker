// Inizializza Firebase
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

// Test connessione Firebase
firebase
  .firestore()
  .collection("test")
  .add({
    testField: "Hello Firebase!",
  })
  .then(() => {
    console.log("Data saved successfully!");
  })
  .catch((error) => {
    console.error("Error writing document: ", error);
  });

// Funzioni per salvare e gestire i dati dell'utente
async function saveUserProfile(username, targetWeight, finalReward) {
  try {
    await db
      .collection("users")
      .doc(username)
      .set({
        username: username,
        targetWeight: parseFloat(targetWeight),
        finalReward: finalReward,
        weights: [],
      });
    alert("Profile saved successfully!");
  } catch (error) {
    console.error("Error saving user profile:", error);
    alert("Failed to save profile. Please try again.");
  }
}

function getUserProfile(username) {
  return db
    .collection("users")
    .doc(username)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return doc.data();
      } else {
        throw new Error("No user profile found.");
      }
    })
    .catch((error) => {
      console.error("Error retrieving user profile:", error);
      alert("Failed to retrieve user profile.");
    });
}

function saveDailyWeight(username, weight) {
  const date = new Date().toISOString().split("T")[0];
  return db
    .collection("users")
    .doc(username)
    .update({
      weights: firebase.firestore.FieldValue.arrayUnion({
        date,
        weight: parseFloat(weight),
      }),
    });
}

function updateProgress(username) {
  getUserProfile(username).then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const weights = data.weights;
      const dates = weights.map((entry) => entry.date);
      const weightValues = weights.map((entry) => entry.weight);

      const ctx = document.getElementById("weight-chart").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: dates,
          datasets: [
            {
              label: "Weight",
              data: weightValues,
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });

      if (weightValues[weightValues.length - 1] <= data.targetWeight) {
        document.getElementById(
          "rewards-list"
        ).innerHTML += `<li>${data.reward}</li>`;
      }
    }
  });
}

function addReward(username, rewardWeight, rewardDescription) {
  return db
    .collection("users")
    .doc(username)
    .update({
      rewards: firebase.firestore.FieldValue.arrayUnion({
        rewardWeight: parseFloat(rewardWeight),
        rewardDescription,
      }),
    });
}

document.addEventListener("DOMContentLoaded", () => {
  // Attempt to retrieve username from localStorage
  const storedUsername = localStorage.getItem("username");
  const usernameField = document.getElementById("username");

  // Setup greeting in the navbar
  const greeting = document.getElementById("greeting");
  if (storedUsername) {
    const formattedUsername =
      storedUsername.charAt(0).toUpperCase() +
      storedUsername.slice(1).toLowerCase();
    greeting.textContent = `Ciao ${formattedUsername}!`;
    usernameField.value = storedUsername;

    // Fetch and display other user details if on profile page
    if (
      document.getElementById("target-weight") &&
      document.getElementById("finalReward")
    ) {
      getUserProfile(storedUsername)
        .then((data) => {
          if (data) {
            document.getElementById("target-weight").value =
              data.targetWeight || "";
            document.getElementById("finalReward").value =
              data.finalReward || "";
          }
        })
        .catch((error) => {
          console.error("Failed to retrieve data:", error);
        });
    }
  }

  if (document.getElementById("setup-form")) {
    document
      .getElementById("setup-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = usernameField.value;
        const targetWeight = document.getElementById("target-weight").value;
        const finalReward = document.getElementById("final-reward").value;
        localStorage.setItem("username", username); // Save the username for future sessions
        await saveUserProfile(username, targetWeight, finalReward);
        alert("Profile saved!");
      });
  }

  if (document.getElementById("weight-form")) {
    document
      .getElementById("weight-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const weight = document.getElementById("weight").value;
        const username = localStorage.getItem("username"); // Ensure username is retrieved correctly
        if (username && weight) {
          try {
            await saveDailyWeight(username, weight);
            alert("Weight saved!");
            document.getElementById("weight-form").reset(); // Optionally reset the form
          } catch (error) {
            console.error("Error saving weight:", error);
            alert("Failed to save weight. Please try again.");
          }
        } else {
          alert("Please enter your weight and ensure your username is set.");
        }
      });
  }

  if (document.getElementById("reward-form")) {
    document
      .getElementById("reward-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = usernameField
          ? usernameField.value
          : localStorage.getItem("username");
        const rewardWeight = document.getElementById("reward-weight").value;
        const rewardDescription =
          document.getElementById("reward-description").value;

        try {
          await addReward(username, rewardWeight, rewardDescription);
          alert("Reward added!");
          document.getElementById("reward-form").reset();
        } catch (error) {
          console.error("Error adding reward:", error);
          alert("Failed to add reward. Please try again.");
        }
      });
  }
});
