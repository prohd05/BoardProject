import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { updateDoc, getDocs, collection, doc, addDoc, getDoc , serverTimestamp} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


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

     
      onAuthStateChanged(auth, async (user) => { 

        // Back Button
        const backButton = document.getElementById("backButton");
        backButton.addEventListener("click", () => {
          window.location.href = "home.html";
        });
        
      // Get BoardID
      const docRef = await getDoc(doc(db, "users", user.uid));
      const BID = docRef.data().viewBoard;
      document.getElementById("bId").textContent = "Board ID: " + BID;

      // Get Board Name
      const boardRef = await getDoc(doc(db, "boards", BID));
      const bName = boardRef.data().name;
      document.getElementById("bName").textContent = "Board Name: " + bName;

      // Get Board Owner
      const ownerID = boardRef.data().creatorID;
      const ownerRef = await getDoc(doc(db, "users", ownerID));
      const ownerName = ownerRef.data().name;
      document.getElementById("bOwner").textContent = "Owner: " + ownerName;
      
      // Get Creation Date
      const createdAt = boardRef.data().createdAt.toDate(); // Convert Firestore timestamp to JavaScript Date
      document.getElementById("bDate").textContent = " Creation Date: " + createdAt.toLocaleString();


    // Get Board Members
      const members = boardRef.data().members; // The array of members itself
      
      let memberNames = "Members: "; // Member list array
      for (const memberID of members) {
        const memberRef = await getDoc(doc(db, "users", memberID));
        memberNames += memberRef.data().name + ", ";
      }

      memberNames = memberNames.slice(0, -2); // Remove comma and space
      document.getElementById("bMembers").textContent = memberNames;

        // Check if user is a member of the board
        const isMember = members.includes(user.uid);
        document.getElementById("bTF").textContent = "Is Member: " + isMember;

        // Join/Leave Button
        const joinButton = document.getElementById("joinButton");
        if (user.uid !== ownerID){ 
        joinButton.textContent = isMember ? "Leave Board" : "Join Board";
        }
        else{
          joinButton.style.display = "none";
        }

        joinButton.addEventListener("click", async () => {
          try{
            if (isMember){ 
              // Remove user from members array
              await updateDoc(doc(db, "boards", BID), {
                members: members.filter(memberID => memberID !== user.uid) // Remove user ID from members array
              });
              window.location.reload(); // Refresh the page to update the membership status
            }
            else{
              // Add user to members array
              await updateDoc(doc(db, "boards", BID), {
                members: [...members, user.uid] // Add user ID to members array
              });
              window.location.reload(); // Refresh the page to update the membership status

            }
          }
          catch(error){
            console.error("Error updating membership: ", error);
            alert("Error updating membership: " + error.message);
          }
        });
    // Comment Section
      displayComments();

      // Allow Comment
      if (isMember){
        const commentForm = document.getElementById("commentForm");
        
        const commentInput = document.createElement("input");
        commentInput.type = "text";
        commentInput.id = "commentInput";
        commentInput.placeholder = "Enter your comment";
        commentInput.required = true;

        const commentButton = document.createElement("button");
        commentButton.type = "submit";
        commentButton.textContent = "Post Comment";

        commentForm.appendChild(commentInput);
        commentForm.appendChild(commentButton);
      }

      // Add Comments 
      commentForm.addEventListener("submit", async (event) => {
        const coi = commentInput.value;
        event.preventDefault();
        
      try{
        await addDoc(collection(db, "comments"), {
          text: coi,
          boardID: BID,
          boardCID:ownerRef.id,
          authorID: user.uid,
          createdAt: serverTimestamp(),
          upvotes: [],
          downvotes: [],
          creatorLiked: false,
        });
        await displayComments(); // Call displayComments to refresh the comments section
        commentInput.value = ""; // Clear the input field after posting
      } catch(error){
        console.error("Error adding comment: ", error);
        alert("Error adding comment: " + error.message);
      }
    });
    
      // Display Comments
      async function displayComments() {
      const comList = document.getElementById("commentsSection");
      comList.innerHTML = ""; // Clear existing comments
      const orderComments = [];
      const commentsSnapshot = await getDocs(collection(db, "comments"));
      commentsSnapshot.forEach((doc) => {
        if (doc.data().boardID === BID){
          orderComments.push({ id: doc.id, ...doc.data() });
        }
      });
      orderComments.sort((a, b) => b.createdAt - a.createdAt); // Sort comments by createdAt in descending order
      orderComments.forEach(async (comment) => {

        const comDiv = document.createElement("div");
        comDiv.className = "commentBox";

        const comText = document.createElement("p");
        comText.className = "commentText";
        comText.textContent = comment.text;

        const authorRef = await getDoc(doc(db, "users", comment.authorID)); // Gets authors ID
        const authorName = authorRef.data().name; // Pulls authors name from ID
        const comAuthor = document.createElement("p");
        comAuthor.className = "commentBy";
        comAuthor.textContent = "By: " + authorName;

        const date = comment.createdAt.toDate(); // Convert Firestore timestamp to JavaScript Date
        const comDate = document.createElement("p");
        comDate.className = "commentDate";
        comDate.textContent = "Posted on: " + date.toLocaleString(); // Format date as a readable string

        const clod = comment.creatorLiked;
        const likeButton = document.createElement("p");
        likeButton.textContent = "Creator Liked: " + clod;

        // Check if user is a member of the board
        const isMember = members.includes(user.uid);
        document.getElementById("bTF").textContent = "Is Member: " + isMember;

        // Upvote Button
        const upvoteButton = document.createElement("button");
        upvoteButton.textContent = "Upvote (" + comment.upvotes.length + ")";

        upvoteButton.addEventListener("click", async () => {

        });

        const comRef = await getDoc(doc(db, "comments", comment.id));
        const likers = comRef.data().upvotes; // The array of members itself
        const likeID = "";
        for (const likeID of likers) {
          const comRef = await getDoc(doc(db, "users", likeID));
          likeID += comRef.data().id + ", ";
        }
        const likeTF = likeID.includes(user.uid);

        // Downvote Button
        const downvoteButton = document.createElement("button");
        downvoteButton.textContent = "Downvote (" + comment.downvotes.length + ")";

        // Make Up/Downvote Buttons Functional, Make creator like fuctional, Make delete/edit buttons for comment authors
        comList.appendChild(comDiv);
        comDiv.appendChild(comText);
        comDiv.appendChild(comAuthor);
        comDiv.appendChild(comDate);
        comDiv.appendChild(likeButton);
        comDiv.appendChild(upvoteButton);
        comDiv.appendChild(downvoteButton);

        // Makes edit button only visible for author
        if (user.uid === comment.authorID){
          const editButton = document.createElement("button");
          editButton.textContent = "Edit";
          comDiv.appendChild(editButton);
        }

        // Creator Like Button
        if (user.uid === comment.boardCID){ 
          const likeButton = document.createElement("button");
          comDiv.appendChild(likeButton);
          likeButton.textContent = clod ? "Creator Unlike" : "Creator Like";
        }
        
        // Makes the delete button on visible for owner and author
        if (user.uid === comment.authorID || user.uid === comment.boardCID){
          const deleteButton = document.createElement("button");
          deleteButton.textContent = "Delete";
          comDiv.appendChild(deleteButton);
        }
       });
      };
    });

     // Look at new Board
      document.addEventListener("DOMContentLoaded", () => {
      const researchForm = document.getElementById("research");
      researchForm.addEventListener("submit", async (event) => {
          event.preventDefault();

          const newBID = document.getElementById("researchID").value;
          const user = auth.currentUser;

          try {
              await updateDoc(doc(db, "users", user.uid), {
                  viewBoard: newBID // Update user's viewBoard to the joined board's ID
              });
              document.getElementById("researchID").value = ""; // Clear the input field
              window.location.reload(); // Refresh the page to load the new board's data
          } catch (error) {
              alert("Error joining board: " + error.message); // Show error to user
              console.error("Join board error:", error); // Log error to console
          }
      });
  });