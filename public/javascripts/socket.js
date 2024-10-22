import { loadFen, startFen } from "./index.js";

let clientSocket = io();
let gameNumber;
export const STATE = {
    RESET: "reset",
    WAITING: "waiting",
    PLAYING: "playing",
    OFFERDRAW: {
        OFFER: "draw_offer_send",
        RECEIVED: "draw_offer_received",
        REFUSED: "draw_offer_refused",
    },
    FINISHED: {
        WIN: {
            CHECKMATE: "win_checkmate",
            RESIGNATION: "win_resignation",
        },
        LOSE: {
            CHECKMATE: "lose_checkmate",
            RESIGNATION: "lose_resignation",
        },
        DRAW: {
            AGREEMENT: "draw_agreement",
            STALEMATE: "draw_stalemate",
        },
    },
};

clientSocket.on("receiveFen", (fen) => {
    loadFen(fen);
});
clientSocket.on("resignedGame", () => {
    controlUI(STATE.FINISHED.WIN.RESIGNATION);
});

clientSocket.on("offeredDraw", () => {
    controlUI(STATE.OFFERDRAW.RECEIVED);
});
clientSocket.on("refusedDraw", () => {
    controlUI(STATE.OFFERDRAW.REFUSED);
});

clientSocket.on("acceptedDraw", () => {
    controlUI(STATE.FINISHED.DRAW.AGREEMENT);
});

clientSocket.on("checkmate", () => {
    controlUI(STATE.FINISHED.LOSE.CHECKMATE);
});

clientSocket.on("stalemate", () => {
    controlUI(STATE.FINISHED.DRAW.STALEMATE);
});

export function startGame() {
    loadFen(startFen);
    // FEN to test stalemate
    //loadFen("1Qb2bnr/4pkpq/5p1r/7p/7P/4P3/PPPP1PP1/RNB1KBNR w");
    clientSocket.emit("play");

    clientSocket.on("waitingPlayer", () => {
        controlUI(STATE.WAITING);
    });

    clientSocket.on("startGame", (number) => {
        gameNumber = number;
        controlUI(STATE.PLAYING);
    });
}

export function resetGame() {
    controlUI(STATE.RESET);
}

export function sendMove(fen) {
    clientSocket.emit("sendFen", fen, gameNumber);
}

export function resignGame() {
    controlUI(STATE.FINISHED.LOSE.RESIGNATION);
    clientSocket.emit("resign", gameNumber);
}

export function offerDraw() {
    controlUI(STATE.OFFERDRAW.OFFER);
    clientSocket.emit("offerDraw", gameNumber);
}

export function refuseDrawOffer() {
    controlUI(STATE.OFFERDRAW.REFUSED);
    clientSocket.emit("refuseDraw", gameNumber);
}

export function acceptDrawOffer() {
    controlUI(STATE.FINISHED.DRAW.AGREEMENT);
    clientSocket.emit("acceptDraw", gameNumber);
}

export function checkmate() {
    controlUI(STATE.FINISHED.WIN.CHECKMATE);
    clientSocket.emit("checkmate", gameNumber);
}

export function stalemate() {
    controlUI(STATE.FINISHED.DRAW.STALEMATE);
    clientSocket.emit("stalemate", gameNumber);
}

export function controlUI(state) {
    const color = document.querySelector("#player-color"),
        gameModal = document.querySelector("#game-modal"),
        board = document.querySelector("#board"),
        play = document.querySelector("#play"),
        resign = document.querySelector("#resign"),
        draw = document.querySelector("#draw"),
        statusMessage = document.querySelector("#game-modal .status-message"),
        gameNumberField = document.querySelector("#game-number"),
        drawButtons = document.querySelector("#game-modal .draw-buttons"),
        closeButton = document.querySelector("#game-modal #close-message"),
        container = document.querySelector(".container");

    switch (state) {
        case "reset":
            color.value = "";
            play.disabled = false;
            resign.disabled = true;
            draw.disabled = true;
            gameModal.style.display = "none";
            drawButtons.style.display = "none";
            closeButton.style.display = "none";
            board.classList.remove("reverse");
            container.classList.remove("white", "black");
            loadFen(startFen);
            break;
        case "waiting":
            color.value = "white";
            container.classList.add("white");
            play.disabled = true;
            statusMessage.textContent = "Warte auf \r\nGegenspieler...";
            gameModal.style.display = "block";
            break;
        case "playing":
            if (!color.value || color.value == "black") {
                color.value = "black";
                container.classList.add("black");
                gameModal.style.display = "block";
                play.disabled = true;
                board.classList.add("reverse");
            }
            gameNumberField.value = gameNumber;
            statusMessage.textContent = "Fertig...\r\nSPIELEN!!";
            resign.disabled = false;
            draw.disabled = false;
            setTimeout(() => {
                gameModal.style.display = "none";
            }, 1000);
            break;
        case "draw_offer_send":
            statusMessage.textContent = "Warte auf Antwort...";
            gameModal.style.display = "block";
            drawButtons.style.display = "none";
            break;
        case "draw_offer_received":
            statusMessage.textContent = "Remis angeboten.\r\n Annehmen?";
            gameModal.style.display = "block";
            drawButtons.style.display = "flex";
            break;
        case "draw_offer_refused":
            gameModal.style.display = "none";
            drawButtons.style.display = "none";
            break;
        case "draw_agreement":
            statusMessage.textContent = "Remis \r\ndurch vereinbarung";
            gameModal.style.display = "block";
            closeButton.style.display = "inline-block";
            drawButtons.style.display = "none";
            break;
        case "lose_resignation":
            statusMessage.textContent = "Du hast durch Rücktritt \r\nverloren";
            gameModal.style.display = "block";
            closeButton.style.display = "inline-block";
            break;
        case "win_resignation":
            statusMessage.textContent = "Du hast durch Rücktritt \r\ngewonnen";
            gameModal.style.display = "block";
            closeButton.style.display = "inline-block";
            break;
        case "lose_checkmate":
            statusMessage.textContent = "Du hast durch Schachmatt \r\nverloren";
            gameModal.style.display = "block";
            closeButton.style.display = "inline-block";
            break;
        case "win_checkmate":
            statusMessage.textContent = "Du hast durch Schachmatt \r\ngewonnen";
            gameModal.style.display = "block";
            closeButton.style.display = "inline-block";
            break;
        case "draw_stalemate":
            statusMessage.textContent = "Remis \r\ndurch Patt";
            gameModal.style.display = "block";
            closeButton.style.display = "inline-block";
            break;
    }
}
