import { auth, db } from "./firebase-config.js";
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const googleBttn = document.getElementById("siGoogle");

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

auth.languageCode = 'it';


googleBttn.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(async (result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;

      // Add user data to Firestore
      try {
        await setDoc(doc(db, "user", user.uid), {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          viewBoard: 0, // Will be set to the boardID of the board they want to view 
          member: false // Will be set true when a user is on the page of a board they are apart of via the array check
        });
        alert("Sign in successful! Welcome " + user.displayName);
        window.location.href = "home.html";
      } catch (dbError) {
        console.error("Error adding user to Firestore: ", dbError);
        alert("Error saving user data.");
      }
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      alert("Error signing in: " + errorMessage);
    });
});
  
  
