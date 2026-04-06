import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { updateDoc, getDocs, collection, doc, addDoc, getDoc , serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const pfp = document.getElementById("pfpBoard"); // Get the element to display the profile picture
        const uni = document.getElementById("unBoard"); // Get the element to display the username
        const mail = document.getElementById("emBoard"); // Get the element to display the email
        uni.textContent = user.displayName; // Set the username in the navbar
        mail.textContent = user.email; // Set the email in the navbar
        pfp.src = user.photoURL || ''; // Set the profile picture in the navbar
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
        
      // Get BoardID
      const docRef = await getDoc(doc(db, "users", user.uid));
      const BID = docRef.data().viewBoard;
      document.getElementById("bId").textContent = "Board ID: " + BID;
      
      const boardRef = await getDoc(doc(db, "boards", BID));
      const members = boardRef.data().members; // The array of members itself
      
      // Get Board Name & Member Count
      const memberCount = members.length;
      
      const bName = boardRef.data().name;
      document.getElementById("bName").textContent = "Board Topic: " + bName + " (" + memberCount + ")";

      // Get Board Owner
      const ownerID = boardRef.data().creatorID;
      const ownerRef = await getDoc(doc(db, "users", ownerID));
      const ownerName = ownerRef.data().name;
      document.getElementById("bOwner").textContent = "Created By: " + ownerName;
      
      // Get Creation Date
      const createdAt = boardRef.data().createdAt.toDate(); // Convert Firestore timestamp to JavaScript Date
      document.getElementById("bDate").textContent = " Creation Date: " + createdAt.toLocaleDateString("en-US");  

    // Get Board Members      
      let memberNames = "Members: "; // Member list array
      for (const memberID of members) {
        const memberRef = await getDoc(doc(db, "users", memberID));
        memberNames += memberRef.data().name + ", ";
      }

      memberNames = memberNames.slice(0, -2); // Remove comma and space
      //document.getElementById("bMembers").textContent = memberNames;

        // Check if user is a member of the board
        const isMember = members.includes(user.uid);
        /*document.getElementById("bTF").textContent = "Is Member: " + isMember;*/


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
    
      // Display Comments
      async function displayComments() {        
        const comList = document.getElementById("commentsSection");

        comList.innerHTML = "";

        // Allow Comment
        const commTitle = document.createElement("p");
        commTitle.textContent = " Add A Comment";

        let commentForm = document.getElementById("commentForm");
        if (!commentForm) {
          commentForm = document.createElement("form");
          commentForm.id = "commentForm";
        }

        commentForm.innerHTML = "";

        const commentInput = document.createElement("textarea");
        commentInput.id = "commentInput";
        commentInput.className = "paragraph1";
        commentInput.placeholder = "Enter your comment";
        commentInput.required = true;
        commentInput.style.resize = "vertical";

        const commentButton = document.createElement("button");
        commentButton.type = "submit";
        commentButton.textContent = "Post Comment";
        commentButton.id="comB"
        commentButton.className = "paragraph1"

        commentForm.appendChild(commentInput);
        commentForm.appendChild(commentButton);

        if (!isMember){
          commentInput.disabled = true;
          commentButton.disabled = true;
          commentInput.placeholder = "Join the board to comment";
          commentButton.style.display = "none";
        }

        commentForm.onsubmit = async (event) => {
          event.preventDefault();

          const coi = commentInput.value;

          try {
            await addDoc(collection(db, "comments"), {
              text: coi,
              boardID: BID,
              boardCID: ownerRef.id,
              commentID: "0",
              authorID: user.uid,
              createdAt: serverTimestamp(),
              upvotes: [],
              downvotes: [],
              creatorLiked: false,
            });

            commentInput.value = "";

            await displayComments();

          } catch (error) {
            console.error("Error adding comment: ", error);
            alert("Error adding comment: " + error.message);
          }
        };

        comList.appendChild(commTitle);
        comList.appendChild(commentForm);

        const orderComments = [];
      const commentsSnapshot = await getDocs(collection(db, "comments"));
      commentsSnapshot.forEach((doc) => {
        if (doc.data().boardID === BID && doc.data().commentID === "0"){
          orderComments.push({ id: doc.id, ...doc.data() });
        }
      });
      orderComments.sort((a, b) => b.createdAt - a.createdAt); // Sort by creation dat      
      orderComments.forEach(async (comment) => {

        const comDiv = document.createElement("div");
          comDiv.className = "commentBox";
        
          const inDiv = document.createElement("div");
          inDiv.className = "commArea";

          const comText = document.createElement("p");
          comText.className = "commentText";
          comText.textContent = comment.text;

          const authorRef = await getDoc(doc(db, "users", comment.authorID)); // Gets authors ID
          const authorName = authorRef.data().name; // Pulls authors name from ID
          const comAuthor = document.createElement("p");
          comAuthor.className = "commentBy";
          comAuthor.textContent = "Posted By " + authorName;

          const date = comment.createdAt.toDate(); // Convert Firestore timestamp to JavaScript Date
          const comDate = document.createElement("p");
          comDate.className = "commentDate";
          comDate.textContent = "Posted on: " + date.toLocaleDateString("en-US"); // Format date as a readable string

          const likeMessage = document.createElement("img");
          likeMessage.className="clike";

          // Check if user is a member of the board
          const isMember = members.includes(user.uid);
          //document.getElementById("bTF").textContent = "Is Member: " + isMember;

          // Upvote and Downvote Buttons
          // Upvote Button
          const upvoteButton = document.createElement("button");
          const downvoteButton = document.createElement("button");

          const upvoteIcon = document.createElement("img");
          const downvoteIcon = document.createElement("img");

          const upvoteText = document.createElement("p");
          const downvoteText = document.createElement("p");

          upvoteButton.className = "icons";
          downvoteButton.className = "icons";

          if (!isMember) {
            upvoteButton.disabled = true;
            downvoteButton.disabled = true;
          }

          const commentRef = doc(db, "comments", comment.id);
          let likers = [...comment.upvotes];
          let dislikers = [...comment.downvotes];

          function updateUpvoteText() {
            upvoteText.textContent = " " + likers.length;
            if (likers.includes(user.uid)) {
              upvoteIcon.src = 'assets/votes/liked.png';
            } else {
              upvoteIcon.src = 'assets/votes/like.png';
            }
          }

          function updateDownvoteText() {
            downvoteText.textContent = " " + dislikers.length;
            if (dislikers.includes(user.uid)) {
              downvoteIcon.src = 'assets/votes/disliked.png';
            } else {
              downvoteIcon.src = 'assets/votes/dislike.png';
            }
          }

          upvoteButton.appendChild(upvoteIcon);
          upvoteButton.appendChild(upvoteText);

          downvoteButton.appendChild(downvoteIcon);
          downvoteButton.appendChild(downvoteText);

          updateUpvoteText();
          updateDownvoteText();

          // Upvote
          upvoteButton.addEventListener("click", async () => {
            try {
              const hasLiked = likers.includes(user.uid);
              const hasDisliked = dislikers.includes(user.uid);

              if (hasLiked) {
                likers = likers.filter(id => id !== user.uid);
              } else {
                likers = [...likers, user.uid];
                dislikers = dislikers.filter(id => id !== user.uid);
              }

              await updateDoc(commentRef, {
                upvotes: likers,
                downvotes: dislikers
              });

              updateUpvoteText();
              updateDownvoteText();

            } catch (error) {
              console.error("Upvote error:", error);
              //alert(error.message);
            }
          });

          // Downvote
          downvoteButton.addEventListener("click", async () => {
            try {
              const hasLiked = likers.includes(user.uid);
              const hasDisliked = dislikers.includes(user.uid);

              if (hasDisliked) {
                dislikers = dislikers.filter(id => id !== user.uid);
              } else {
                dislikers = [...dislikers, user.uid];
                likers = likers.filter(id => id !== user.uid);
              }

              await updateDoc(commentRef, {
                upvotes: likers,
                downvotes: dislikers
              });

              updateDownvoteText();
              updateUpvoteText();

            } catch (error) {
              console.error("Downvote error:", error);
              //alert(error.message);
            }
          });

          // Check Mark

          // Make Up/Downvote Buttons Functional, Make creator like fuctional, Make delete/edit buttons for comment authors
          const buttons = document.createElement("div");
          const area = document.createElement("div");
          buttons.className = "butts";
          area.className = "area"
          comList.appendChild(comDiv);
          comDiv.appendChild(area)
          area.appendChild(inDiv)
          inDiv.appendChild(likeMessage);
          inDiv.appendChild(comAuthor);
          inDiv.appendChild(comText);  
          inDiv.appendChild(comDate);
          area.appendChild(buttons);

          const bl = document.createElement("div")
          const br = document.createElement("div")
          buttons.appendChild(bl);
          buttons.appendChild(br);

          bl.appendChild(upvoteButton);
          bl.appendChild(downvoteButton);

          // Creator Like Button
            const likeButton = document.createElement("button");
            likeButton.className = "icons";
            br.appendChild(likeButton);

            const likeBI = document.createElement("img")
            likeButton.appendChild(likeBI);

          function updateCreatorLikeText() {
              likeBI.src = comment.creatorLiked ? "assets/votes/hearted.png" : "assets/votes/heart.png";
              likeMessage.src= comment.creatorLiked?"assets/creator.png":"assets/blank.png"
            }
            updateCreatorLikeText();
          if (user.uid === comment.boardCID){ 
            
            likeButton.addEventListener("click", async () => {
            try {
              comment.creatorLiked = !comment.creatorLiked;
              updateCreatorLikeText();
              await updateDoc(commentRef, {
                creatorLiked: comment.creatorLiked,
              });
            } catch (error) {
              console.error("Upvote error:", error);
              alert(error.message);
            }
          });
          }
          else{
            likeButton.style.display = "none";
          }
          
          // Makes the delete button on visible for owner and author
          if (user.uid === comment.authorID || user.uid === comment.boardCID){
            const deleteButton = document.createElement("button");
                  const deleteIcon = document.createElement("img")
                  deleteButton.appendChild(deleteIcon)
                  deleteButton.className="icons"
                  deleteIcon.src = "assets/delete.png";
                  br.appendChild(deleteButton);

            deleteButton.addEventListener("click", async () => {
              try {
                await deleteDoc(doc(db, "comments", comment.id));
                displayComments();
              } catch (error) {
                console.error("Delete error:", error);
                alert(error.message);
              }
            });
          }

          // Reply to Comment 
          const replyForm = document.createElement("form");
          replyForm.className = "replyForm"
        
          const replyInput = document.createElement("textarea");
          replyInput.className="repIn"
          replyInput.id = "replyInput";
          replyInput.placeholder = "Reply to comment";
          replyInput.required = true;
          replyInput.rows = 1;

          const replyButton = document.createElement("button");
          replyButton.type = "submit";
          replyButton.className="repBut"
          const replylogo = document.createElement("img");
          replylogo.src = "assets/reply.png";
          replylogo.alt = "Reply";
          replylogo.className="replo"
          replyButton.appendChild(replylogo);
          comDiv.appendChild(replyForm);
          replyForm.appendChild(replyInput);
          replyForm.appendChild(replyButton);

          const replyArea = document.createElement("div");
          replyArea.className = "replies"
          comDiv.appendChild(replyArea);
          displayReplies(comment.id);
          async function displayReplies(CID) {
            replyArea.innerHTML = ""; // Clear existing comments
              const orderReply = [];
              const replySnapshot = await getDocs(collection(db, "comments"));
              replySnapshot.forEach((doc) => {
                if (doc.data().commentID === CID) { // Checks if comment is a top level comment for the board
                  orderReply.push({ id: doc.id, ...doc.data() });
                }
              });
            orderReply.sort((a, b) => b.createdAt - a.createdAt); // Sort by creation dat      
            orderReply.forEach(async (comment) => {
                const repDiv = document.createElement("div");
                repDiv.className = "replyBox";
                
                const authorRef = await getDoc(doc(db, "users", comment.authorID)); // Gets authors ID
                const authorName = authorRef.data().name; // Pulls authors name from ID
                const comAuthor = document.createElement("p");
                comAuthor.textContent = authorName + " Replied";
      
                const comText = document.createElement("p");
                comText.className = "commentText";
                comText.textContent = comment.text;
      
                const date = comment.createdAt.toDate(); // Convert Firestore timestamp to JavaScript Date
                const comDate = document.createElement("p");
                comDate.className = "commentDate";
                comDate.textContent = "Posted on: " + date.toLocaleDateString("en-US"); // Format date as a readable string
      
                const likeMessage = document.createElement("img");
                likeMessage.className="clike";
      
                // Check if user is a member of the board
                const isMember = members.includes(user.uid);
                //document.getElementById("bTF").textContent = "Is Member: " + isMember;
      
                // Upvote and Downvote Buttons
                 // Upvote Button
                const upvoteButton = document.createElement("button");
                const downvoteButton = document.createElement("button");

                const upvoteIcon = document.createElement("img");
                const downvoteIcon = document.createElement("img");

                const upvoteText = document.createElement("p");
                const downvoteText = document.createElement("p");

                upvoteButton.className = "icons";
                downvoteButton.className = "icons";

                if (!isMember) {
                  upvoteButton.disabled = true;
                  downvoteButton.disabled = true;
                }

                const commentRef = doc(db, "comments", comment.id);
                let likers = [...comment.upvotes];
                let dislikers = [...comment.downvotes];

                function updateUpvoteText() {
                  upvoteText.textContent = " " + likers.length;
                  if (likers.includes(user.uid)) {
                    upvoteIcon.src = 'assets/votes/liked.png';
                  } else {
                    upvoteIcon.src = 'assets/votes/like.png';
                  }
                }

                function updateDownvoteText() {
                  downvoteText.textContent = " " + dislikers.length;
                  if (dislikers.includes(user.uid)) {
                    downvoteIcon.src = 'assets/votes/disliked.png';
                  } else {
                    downvoteIcon.src = 'assets/votes/dislike.png';
                  }
                }

                upvoteButton.appendChild(upvoteIcon);
                upvoteButton.appendChild(upvoteText);

                downvoteButton.appendChild(downvoteIcon);
                downvoteButton.appendChild(downvoteText);

                updateUpvoteText();
                updateDownvoteText();

                // Upvote
                upvoteButton.addEventListener("click", async () => {
                  try {
                    const hasLiked = likers.includes(user.uid);
                    const hasDisliked = dislikers.includes(user.uid);

                    if (hasLiked) {
                      likers = likers.filter(id => id !== user.uid);
                    } else {
                      likers = [...likers, user.uid];
                      dislikers = dislikers.filter(id => id !== user.uid);
                    }

                    await updateDoc(commentRef, {
                      upvotes: likers,
                      downvotes: dislikers
                    });

                    updateUpvoteText();
                    updateDownvoteText();

                  } catch (error) {
                    console.error("Upvote error:", error);
                    //alert(error.message);
                  }
                });

                // Downvote
                downvoteButton.addEventListener("click", async () => {
                  try {
                    const hasLiked = likers.includes(user.uid);
                    const hasDisliked = dislikers.includes(user.uid);

                    if (hasDisliked) {
                      dislikers = dislikers.filter(id => id !== user.uid);
                    } else {
                      dislikers = [...dislikers, user.uid];
                      likers = likers.filter(id => id !== user.uid);
                    }

                    await updateDoc(commentRef, {
                      upvotes: likers,
                      downvotes: dislikers
                    });

                    updateDownvoteText();
                    updateUpvoteText();

                  } catch (error) {
                    console.error("Downvote error:", error);
                    //alert(error.message);
                  }
                });
      
                // Make Up/Downvote Buttons Functional, Make creator like fuctional, Make delete/edit buttons for comment authors
                const buttons2 = document.createElement("div");
                const area = document.createElement("div");
                const inDiv = document.createElement("div");
                buttons2.className = "butts"
                area.className="area"
                inDiv.className="repArea"
                replyArea.appendChild(repDiv);
                repDiv.appendChild(area)
                area.appendChild(inDiv)
                inDiv.appendChild(likeMessage);
                inDiv.appendChild(comAuthor);
                inDiv.appendChild(comText);
                inDiv.appendChild(comDate);
                area.appendChild(buttons2);

                const bl = document.createElement("div")
                const br = document.createElement("div")
                buttons2.appendChild(bl);
                buttons2.appendChild(br);

                bl.appendChild(upvoteButton);
                bl.appendChild(downvoteButton);
      
                // Creator Like Button
                const likeButton = document.createElement("button");
                likeButton.className = "icons";
                br.appendChild(likeButton);

                const likeBI = document.createElement("img")
                likeButton.appendChild(likeBI);

              function updateCreatorLikeText() {
                  likeBI.src = comment.creatorLiked ? "assets/votes/hearted.png" : "assets/votes/heart.png";
                  likeMessage.src= comment.creatorLiked?"assets/creator.png":"assets/blank.png"
                }
      
                  updateCreatorLikeText();
                if (user.uid === comment.boardCID){ 
      
                  likeButton.addEventListener("click", async () => {
                  try {
                    comment.creatorLiked = !comment.creatorLiked;
                    updateCreatorLikeText();
                    await updateDoc(commentRef, {
                      creatorLiked: comment.creatorLiked,
                    });
                  } catch (error) {
                    console.error("Upvote error:", error);
                    alert(error.message);
                  }
                });
                }
                else{
                  likeButton.style.display = "none";
                }
                
                // Makes the delete button on visible for owner and author
                if (user.uid === comment.authorID || user.uid === comment.boardCID){
                  const deleteButton = document.createElement("button");
                  const deleteIcon = document.createElement("img")
                  deleteButton.appendChild(deleteIcon)
                  deleteButton.className="icons"
                  deleteIcon.src = "assets/delete.png";
                  br.appendChild(deleteButton);
      
                  deleteButton.addEventListener("click", async () => {
                    try {
                      await deleteDoc(doc(db, "comments", comment.id));
                      displayComments();
                    } catch (error) {
                      console.error("Delete error:", error);
                      alert(error.message);
                    }
                  });
                }
              });
            };

          
        if (!isMember){
          replyInput.disabled = true;
          replyButton.disabled = true;
          replyInput.placeholder = "Join the board to comment";
        }

        replyForm.addEventListener("submit", async (event) => {
              const roi = replyInput.value;
              event.preventDefault();
              
            try{
              await addDoc(collection(db, "comments"), {
                text: roi,
                boardID: BID,
                boardCID:ownerRef.id,
                commentID:comment.id,
                authorID: user.uid,
                createdAt: serverTimestamp(),
                upvotes: [],
                downvotes: [],
                creatorLiked: false,
              });
              await displayReplies(comment.id);
              replyInput.value = ""; // Clear the input field after posting
            } catch(error){
              console.error("Error adding comment: ", error);
              alert("Error adding comment: " + error.message);
            }
          });
        });
        };
      }); 

      const cli = document.getElementById("nClick");
      cli.addEventListener("click", async (event) =>{
        window.location.href = "home.html";
      });