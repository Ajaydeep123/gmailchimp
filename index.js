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

//Our app need to obtain an access token to authenticate with gmail.
auth.setCredentials({ refresh_token: REFRESH_TOKEN });

const repliedUsers = new Set();

async function retrieveEmailsAndSendReplies() {
  try {
    //Creating the gmail client
    const gmail = google.gmail({ version: "v1", auth: auth });

    // fetch unread emails
    const res = await gmail.users.messages.list({
      userId: "me",  //authenticated user
      q: "is:unread",
    });
    const messages = res.data.messages;

    if (messages && messages.length > 0) {
      // Fetch the complete message details.

      for (const message of messages) {
        const email = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });
        
        const from = email.data.payload.headers.find(
          (header) => header.name === "From"
        );
        const toHeader = email.data.payload.headers.find(
          (header) => header.name === "To"
        );
        const Subject = email.data.payload.headers.find(
          (header) => header.name === "Subject"
        );
        //who sends email extracted
        const From = from.value;
        //who gets email extracted
        const toEmail = toHeader.value;
        //subject of unread email
        const subject = Subject.value;

        console.log("Received email from", From);
        console.log("to Email", toEmail);
        
        //check if the user already been replied to
        if (repliedUsers.has(From)) {
          console.log("Already replied to : ", From);
          continue;
        }
        // 2.send replies to Emails that have no prior replies
        // Check if the email has any replies.
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: message.threadId,
        });

        //isolated the email into threads
        const replies = thread.data.messages.slice(1);

        if (replies.length === 0) {
          // Reply to the email.
          await gmail.users.messages.send({
            userId: "me",
            requestBody: {
              raw: await createReply(toEmail, From, subject),
            },
          });

          // Add a label to the email.
          const labelName = "OnVacation";
          await gmail.users.messages.modify({
            userId: "me",
            id: message.id,
            requestBody: {
              addLabelIds: [await createLabelIfNeeded(labelName)],
            },
          });

          console.log("Sent reply to email:", From);
          //Add the user to replied users set
          repliedUsers.add(From);
        }
      }
    }
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

// NOTES: gmail api follows strict formatting of text inside the Mail.So, in it's adherence we'll convert our message to base64 encoding
async function createReply(from, to, subject) {
  const emailContent = `From: ${from}\nTo: ${to}\nSubject: ${subject}\n\n Hey There! I'm currently out of the station and will return on 15 August, 2024. I'll get back to you soon. Thank you for understanding.`;
  const base64EncodedEmail = Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return base64EncodedEmail;
}

//Adding Label to the mails

// 3.add a Label to the email and move the email to the label
async function createLabelIfNeeded(labelName) {
  const gmail = google.gmail({ version: "v1", auth: auth });
  // Check if the label already exists.
  const res = await gmail.users.labels.list({ userId: "me" });
  const labels = res.data.labels;

  const existingLabel = labels.find((label) => label.name === labelName);
  if (existingLabel) {
    return existingLabel.id;
  }

  // Create the label if it doesn't exist.
  const newLabel = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: labelName,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });

  return newLabel.data.id;
}

/*4.repeat this sequence of steps 1-3 in random intervals of 45 to 120 seconds*/
function getRandomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

//Setting Interval and calling main function in every interval
setInterval(retrieveEmailsAndSendReplies, getRandomInterval(45, 120) * 1000);
