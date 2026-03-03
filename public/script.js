const socket = io();

const nameInput = document.getElementById("name");
const rollBtn = document.getElementById("rollBtn");
const rolls = document.getElementById("rolls");

const commentInput = document.getElementById("commentInput");
const sendBtn = document.getElementById("sendBtn");
const chat = document.getElementById("chat");

rollBtn.addEventListener("click", () => {
  const name = nameInput.value;
  if (!name) {
    alert("Skriv namen först");
    return;
  }
  const roll = Math.floor(Math.random() * 6 + 1);
  socket.emit("rollDice", { name, roll });
} );

sendBtn.addEventListener("click", () => {
  const name = nameInput.value;
  const comment = commentInput.value;
  if (!name || !comment) {
    alert("Skriv namn och kommentar först");
    return;
  }
  socket.emit("comment", { name, comment });
  commentInput.value = "";
} );

socket.on("diceResult", (data) => {
  const div = document.createElement("div");
  div.textContent = `${data.name} kastade ${data.roll}. Total: ${data.total}`;
  rolls.prepend(div);
} );

socket.on("newComment", (data) => {
  const div = document.createElement("div");
  div.textContent = `${data.name}: ${data.comment}`;
  chat.prepend(div);
} );