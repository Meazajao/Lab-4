const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.static("public"));

//MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/diceDB")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

// Schema + Model 
const diceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  roll: { type: Number, required: true, min: 1, max: 6 },
  total: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Dice = mongoose.model("Dice", diceSchema);


app.get("/api/dice", async (req, res) => {
  try {
    const rolls = await Dice.find().sort({ createdAt: -1 });
    res.json(rolls);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch dice rolls" });
  }
});

//  Håller koll på totalsumma per socket ,undviker namn krockar
const playerTotalsBySocket = new Map(); 
const playerNameBySocket = new Map();   

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("rollDice", async (data) => {
    try {
      const name = (data?.name || "").trim();
      const roll = Number(data?.roll);

      if (!name) return;                 
      if (!Number.isInteger(roll)) return;
      if (roll < 1 || roll > 6) return;  


      playerNameBySocket.set(socket.id, name);

      const prevTotal = playerTotalsBySocket.get(socket.id) || 0;
      const newTotal = prevTotal + roll;
      playerTotalsBySocket.set(socket.id, newTotal);

      // spara i databasen
      const newRoll = await Dice.create({
        name,
        roll,
        total: newTotal,
      });

      // skicka till alla
      io.emit("diceResult", {
        name: newRoll.name,
        roll: newRoll.roll,
        total: newRoll.total,
        createdAt: newRoll.createdAt,
      });
    } catch (err) {
      console.log("rollDice error:", err);
    }
  });

  socket.on("comment", (data) => {
    const name = (data?.name || "").trim();
    const comment = (data?.comment || "").trim();
    if (!name || !comment) return;

    io.emit("newComment", {
      name,
      comment,
      createdAt: new Date(),
    });
  });

  socket.on("disconnect", () => {
    playerTotalsBySocket.delete(socket.id);
    playerNameBySocket.delete(socket.id);
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});