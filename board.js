import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const uni = document.getElementById("unBoard"); // Get the element to display the username
        uni.textContent = user.displayName; // Set the username in the navbar
      } catch (error) {
        console.error("Error fetching user:", error); 
      }
  
    } else {
      setTimeout(() => {
        window.location.href = "signin.html";
      }, 1000);
    }
  });
  
  /// Sign Out Button
      const logoutButton = document.getElementById("soBoard"); // Select the logout button using its ID
      logoutButton.addEventListener("click", async () => {
      try {
      await signOut(auth);
      //alert("Logged out successfully!");
      window.location.href = "signin.html";
      } catch (error) {
      console.log("Error logging out: " + error.message);
      }
      });

const user = auth.currentUser; // Get the currently signed-in user
const boardName = document.getElementById("bName");
boardName.textContent = "Board Name: " + user.viewBoard; // Set the board name in the header