// TODO:
// Implement Node.js based app that is able to respond to emails sent to my account while i'm out on vacation

/*  
FEATURES:
1.The app should check for new emails in a given Gmail ID
2.App should only reply to first time email threads sent by others to your mailbox.
The app should make sure that no double replies are sent to any email at any point.
3.After sending the reply, the email should be tagged with a label in Gmail.
If the label is not created already, we'll need to create it.
4.The app should repeat this sequence of steps 1-3 in random intervals of 45 to 120 seconds.
*/

// CODE:

//1.Load client libraries and credentials
const { google } = require("googleapis");
const {
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI,
  REFRESH_TOKEN,
} = require("./credentials");


const auth = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
