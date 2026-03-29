import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { updateDoc, collection, doc, addDoc, getDoc , serverTimestamp} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Listen for auth state changes
  onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const uni = document.getElementById("unHome"); // Get the element to display the username
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
    const logoutButton = document.getElementById("soHome"); // Select the logout button using its ID
    logoutButton.addEventListener("click", async () => {
    try {
    await signOut(auth);
    //alert("Logged out successfully!");
    window.location.href = "signin.html";
    } catch (error) {
    console.log("Error logging out: " + error.message);
    }
    });

// Add Board
    document.addEventListener("DOMContentLoaded", () => {
    const createForm = document.getElementById("create");
    createForm.addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const bName = document.getElementById("boardName").value;
        const user = auth.currentUser;
        
        try {
          const boardRef = await addDoc(collection(db, "boards"), {
            name: bName,
            creatorID: user.uid, // Adds userID to doc
            createdAt: serverTimestamp(), // Timestamp for sorting
            members: [user.uid] // Initialize members array with creator's ID
            });
            await updateDoc(doc(db, "users", user.uid), {
                viewBoard: boardRef.id // Update user's viewBoard to the new board's name
            });
            document.getElementById("boardName").value = ""; // Clear the input field
            window.location.href = "board.html"; // Redirect to board page after creation
           } catch (error) {
            alert("Error placing order: " + error.message); // Show error to user
            console.error("Order error:", error); // Log error to console
        }
      });
    });

// Join Board
    document.addEventListener("DOMContentLoaded", () => {
    const joinForm = document.getElementById("join");
    joinForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const bID = document.getElementById("boardID").value;
        const user = auth.currentUser;

        try {
            await updateDoc(doc(db, "users", user.uid), {
                viewBoard: bID // Update user's viewBoard to the joined board's ID
            });
            document.getElementById("boardID").value = ""; // Clear the input field
            window.location.href = "board.html"; // Redirect to board page after joining
        } catch (error) {
            alert("Error joining board: " + error.message); // Show error to user
            console.error("Join board error:", error); // Log error to console
        }
    });
});
    