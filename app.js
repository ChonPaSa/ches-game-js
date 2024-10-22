import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import bodyParser from "body-parser";

import path from "path";
import { fileURLToPath } from "url";

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";

//* Connect to the database
mongoose
    .connect("mongodb://localhost:27017", {
        dbName: "chess",
    })
    .then(() => {
        console.log("Connected to the Database.");
    })
    .catch((err) => console.error(err));

const app = express();
const port = "3000";

app.set("port", port);

//* Create HTTP server.
const server = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//* view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "./public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/", indexRouter);
app.use("/users", usersRouter);

const io = new Server(server, { transports: ["websocket", "polling"] });

//? It will be incremented in everytime a game starts
let currentGame = 1;
let games = [];

io.on("connection", (socket) => {
    console.log(`connected ${socket.id} on ${socket.conn.remoteAddress}`);

    socket.on("play", function () {
        if (io.sockets.adapter.rooms.get(currentGame)) {
            socket.join(currentGame);
            io.to(currentGame).emit("startGame", currentGame);
            games[socket.id] = currentGame;
            currentGame++;
            console.log(`game ${currentGame} started`);
        } else {
            socket.join(currentGame);
            games[socket.id] = currentGame;
            io.to(currentGame).emit("waitingPlayer");
        }
    });

    socket.on("sendFen", function (fen, gameNumber) {
        socket.to(gameNumber).emit("receiveFen", fen);
    });

    socket.on("offerDraw", function (gameNumber) {
        socket.to(gameNumber).emit("offeredDraw");
    });

    socket.on("refuseDraw", function (gameNumber) {
        socket.to(gameNumber).emit("refusedDraw");
    });

    socket.on("acceptDraw", function (gameNumber) {
        socket.to(gameNumber).emit("acceptedDraw");
    });

    socket.on("resign", function (gameNumber) {
        socket.to(gameNumber).emit("resignedGame");
    });

    socket.on("checkmate", function (gameNumber) {
        socket.to(gameNumber).emit("checkmate");
    });

    socket.on("stalemate", function (gameNumber) {
        socket.to(gameNumber).emit("stalemate");
    });

    socket.on("disconnect", function () {
        let abandonnedGame = games[socket.id];
        socket.to(abandonnedGame).emit("resignedGame");
        games = games.filter((g) => g !== abandonnedGame);
    });
});


//* Listen on provided port, on all network interfaces.
server.listen(port);
