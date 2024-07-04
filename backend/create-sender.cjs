const uuid = require("uuid");
const { sign } = require("jsonwebtoken");

const secret = process.argv[2];
const senderId = process.argv[3] || uuid.v4();

if (!secret) {
  console.error("Provide a secret value.");
} else {
  console.log("Sender token: ", sign({ senderId }, secret));
}
