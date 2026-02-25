const socket = io();

const totals = {}; 
let myName = "";

const els = {
  name: document.getElementById("name"),
  rollBtn: document.getElementById("rollBtn"),
  clearBtn: document.getElementById("clearBtn"),
  sendBtn: document.getElementById("sendBtn"),
  commentInput: document.getElementById("commentInput"),

  statusText: document.getElementById("statusText"),
  led: document.getElementById("led"),

  rollNumber: document.getElementById("rollNumber"),
  dice2d: document.getElementById("dice2d"),
  pulse: document.getElementById("pulse"),

  lastRoll: document.getElementById("lastRoll"),
  myTotal: document.getElementById("myTotal"),

  leaderboard: document.getElementById("leaderboard"),
  results: document.getElementById("results"),
  chat: document.getElementById("chat"),
};

function safeName() {
  return (els.name.value || "").trim();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setDiceFace2D(roll) {

  const pips = els.dice2d.querySelectorAll(".pip");
  pips.forEach(p => p.style.opacity = "0");

  const on = (sel) => {
    const el = els.dice2d.querySelector(sel);
    if (el) el.style.opacity = "1";
  };

  // face pattern on the roll dice
  if (roll === 1) on(".pip.c");
  if (roll === 2) { on(".pip.tl"); on(".pip.br"); }
  if (roll === 3) { on(".pip.tl"); on(".pip.c"); on(".pip.br"); }
  if (roll === 4) { on(".pip.tl"); on(".pip.tr"); on(".pip.bl"); on(".pip.br"); }
  if (roll === 5) { on(".pip.tl"); on(".pip.tr"); on(".pip.c"); on(".pip.bl"); on(".pip.br"); }
  if (roll === 6) { on(".pip.tl"); on(".pip.tr"); on(".pip.ml"); on(".pip.mr"); on(".pip.bl"); on(".pip.br"); }

  // animation
  els.dice2d.classList.add("show");
  els.pulse.classList.remove("on");
  void els.pulse.offsetWidth; 
  els.pulse.classList.add("on");
}

function updateLeaderboard() {
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  els.leaderboard.innerHTML = "";

  if (entries.length === 0) {
    els.leaderboard.innerHTML = `<div style="color:rgba(220,255,245,0.62);font-size:12px;">Inga kast ännu…</div>`;
    return;
  }

  for (let i = 0; i < entries.length; i++) {
    const [name, total] = entries[i];
    const div = document.createElement("div");
    div.className = "rowitem";
    div.innerHTML = `
      <div class="meta">
        <div class="name">${i === 0 ? "👑 " : ""}${escapeHtml(name)}</div>
        <div class="sub">Rank #${i + 1}</div>
      </div>
      <div class="val">${total}</div>
    `;
    els.leaderboard.appendChild(div);
  }
}

function addFeedItem({ name, roll, total, createdAt }) {
  const time = createdAt ? new Date(createdAt).toLocaleTimeString() : new Date().toLocaleTimeString();
  const div = document.createElement("div");
  div.className = "rowitem";
  div.innerHTML = `
    <div class="meta">
      <div class="name">${escapeHtml(name)}</div>
      <div class="sub">+${roll} • total ${total} • ${time}</div>
    </div>
    <div class="val">🎲</div>
  `;
  els.results.appendChild(div);
  els.results.scrollTop = els.results.scrollHeight;
}

function addChatBubble({ name, comment, createdAt }) {
  const time = createdAt ? new Date(createdAt).toLocaleTimeString() : new Date().toLocaleTimeString();
  const div = document.createElement("div");
  div.className = "bubble";
  div.innerHTML = `
    <div class="who"><b>${escapeHtml(name)}</b> • ${time}</div>
    <div class="msg">${escapeHtml(comment)}</div>
  `;
  els.chat.appendChild(div);
  els.chat.scrollTop = els.chat.scrollHeight;
}

function rollDice() {
  const name = safeName();
  if (!name) return alert("Skriv ditt namn först 🙂");
  myName = name;

  const roll = Math.floor(Math.random() * 6 + 1);

  // local feedback
  els.rollNumber.textContent = String(roll);
  setDiceFace2D(roll);

 
  socket.emit("rollDice", { name, roll });
}

function sendComment() {
  const name = safeName();
  const comment = (els.commentInput.value || "").trim();
  if (!name) return alert("Skriv ditt namn först 🙂");
  if (!comment) return;

  socket.emit("comment", { name, comment });
  els.commentInput.value = "";
}

/* UI events */
els.rollBtn.addEventListener("click", rollDice);
els.sendBtn.addEventListener("click", sendComment);

els.commentInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendComment();
});
els.name.addEventListener("keydown", (e) => {
  if (e.key === "Enter") rollDice();
});

els.clearBtn.addEventListener("click", () => {
  Object.keys(totals).forEach(k => delete totals[k]);
  els.leaderboard.innerHTML = "";
  els.results.innerHTML = "";
  els.chat.innerHTML = "";
  els.rollNumber.textContent = "—";
  els.lastRoll.textContent = "—";
  els.myTotal.textContent = "—";
  setDiceFace2D(1);
  updateLeaderboard();
});

/* socket status */
socket.on("connect", () => {
  els.statusText.textContent = "CONNECTED";
  els.led.style.background = "#50FFD6";
});
socket.on("disconnect", () => {
  els.statusText.textContent = "DISCONNECTED";
  els.led.style.background = "#FF5C7A";
});

/* realtime events */
socket.on("diceResult", (data) => {
  totals[data.name] = data.total;
  updateLeaderboard();
  addFeedItem(data);

  if (data.name === myName) {
    els.lastRoll.textContent = String(data.roll);
    els.myTotal.textContent = String(data.total);
  }
});

socket.on("newComment", (data) => {
  addChatBubble(data);
});

/* init */
setDiceFace2D(1);
updateLeaderboard();