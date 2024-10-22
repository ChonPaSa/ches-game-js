import * as chessSocket from "./socket.js";
import * as chessControl from "./moveControl.js";

const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const pieces = {
    k: { name: "king", color: "black", img: "/images/kd.svg" },
    q: { name: "queen", color: "black", img: "/images/qd.svg" },
    r: { name: "rook", color: "black", img: "/images/rd.svg" },
    b: { name: "bishop", color: "black", img: "/images/bd.svg" },
    n: { name: "knight", color: "black", img: "/images/nd.svg" },
    p: { name: "pawn", color: "black", img: "/images/pd.svg" },
    K: { name: "king", color: "white", img: "/images/kl.svg" },
    Q: { name: "queen", color: "white", img: "/images/ql.svg" },
    R: { name: "rook", color: "white", img: "/images/rl.svg" },
    B: { name: "bishop", color: "white", img: "/images/bl.svg" },
    N: { name: "knight", color: "white", img: "/images/nl.svg" },
    P: { name: "pawn", color: "white", img: "/images/pl.svg" },
};

let movingPiece, originMove, toPlay;

export const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w";

/** Initialize */
window.onload = init;

function init() {
    createBoard();
    loadFen(startFen);
    controlListeners();
}

/** Init Function that create the Board and calls to the loadFen to setup the initial position */
function createBoard() {
    const board = document.querySelector("#board");
    for (const rank of ranks.reverse()) {
        for (const file of files) {
            const square = document.createElement("div");
            square.id = file + rank;
            square.classList.add((file.charCodeAt() + rank) % 2 ? "light-square" : "dark-square", "square");
            board.appendChild(square);

            square.ondrop = (e) => {
                e.preventDefault();
                movePiece(square);
            };
            square.ondragover = (e) => e.preventDefault();
        }
    }
}

/**
 * it loads the position in FEN notation into the board adding
 *
 * @param fen position in FEN notation
 */
export function loadFen(fen) {
    const squares = document.querySelectorAll("#board .square");
    const current = document.querySelector("#current-fen");
    const [position, turn] = fen.split(" ");
    const fenRows = position.split("/");

    //Clear the board
    squares.forEach((square) => {
        const piece = square.querySelector(".piece");
        if (piece) piece.remove();
    });

    fenRows.forEach((fenRow, rowIndex) => {
        let rowCellIndex = 0;
        for (let i = 0; i < fenRow.length; i++) {
            const char = fenRow[i];
            if (isNaN(char)) {
                addPiece(char, squares[rowIndex * 8 + rowCellIndex]);
                rowCellIndex++;
            } else {
                rowCellIndex += parseInt(char, 10);
            }
        }
    });

    if (turn) turnToggle(turn);
    current.value = fen;
}

function turnToggle(turn) {
    let turnText = "Wer ist am Zug ist nicht definiert";
    if (!turn && toPlay) {
        turn = toPlay.charAt(0);
    }
    switch (turn) {
        case "b":
            turnText = "Schwarz ist am Zug";
            toPlay = "black";
            break;
        case "w":
            turnText = "Weiß ist am Zug";
            toPlay = "white";
            break;
    }
    const turnElement = document.querySelector("#turn");
    turnElement.textContent = turnText;
    turnElement.setAttribute("data-turn", turn);
}

/**
 * position a piece on an square. Both of these values are received as paramenters
 * @param pieceName
 * @param  square
 */
function addPiece(pieceName, square) {
    if (!pieces[pieceName]) return;

    const pieceContainer = document.createElement("div");
    const piece = document.createElement("img");

    pieceContainer.classList.add("piece", pieces[pieceName].name, pieces[pieceName].color);
    piece.src = pieces[pieceName].img;

    const handleMoveEvent = () => {
        const playerColor = document.querySelector("#player-color").value;
        if (pieceContainer.classList.contains(toPlay) && (playerColor === toPlay || playerColor === "")) {
            movingPiece = pieceContainer;
            originMove = movingPiece.parentElement.id;
            chessControl.showLegalMoves(movingPiece);
        }
    };

    pieceContainer.addEventListener("dragstart", handleMoveEvent);
    pieceContainer.addEventListener("click", handleMoveEvent);

    pieceContainer.appendChild(piece);
    square.appendChild(pieceContainer);
}

/**
 * It deletes the piece already located in the square if any and append the piece being dragged
 * @param square target square of the piece
 */
function movePiece(square) {
    if (!movingPiece || square.id === movingPiece.parentElement.id || !chessControl.allLegalMoves.includes(square.id)) return;

    const color = movingPiece.classList.contains("black") ? "black" : "white";
    const opponentColor = color === "black" ? "white" : "black";
    const pieceName = movingPiece.classList[1];

    // Detect if castling is happening (king moves two squares) and move the rook too
    if (pieceName === "king" && Math.abs(square.id.charCodeAt(0) - originMove.charCodeAt(0)) === 2) {
        const isKingside = square.id === (color === "white" ? "g1" : "g8");
        const rookStart = isKingside ? "h" : "a";
        const rookTarget = isKingside ? "f" : "d";
        const rookSquare = document.querySelector(`#${rookStart}${color === "white" ? "1" : "8"}`);
        const targetRookSquare = document.querySelector(`#${rookTarget}${color === "white" ? "1" : "8"}`);
        chessControl.clearSquare(targetRookSquare);
        targetRookSquare.appendChild(rookSquare.querySelector(".piece"));
    }

    //Check castling rights
    if (pieceName === "king" || pieceName === "rook") chessControl.updateCastleRights(originMove, color, pieceName);

    chessControl.clearSquare(square);

    // Promotion
    if (pieceName === "pawn" && color == "white" && square.id[1] == 8) {
        addPiece("Q", square);
    } else if (pieceName === "pawn" && color == "black" && square.id[1] == 1) {
        addPiece("q", square);
    } else {
        square.appendChild(movingPiece);
    }

    movingPiece = null;
    turnToggle(color === "white" ? "b" : "w");

    chessControl.removeLegalMoves();
    updateFen();

    // check if game finished by checkmate or stalemate
    const opponentsPieces = document.querySelectorAll(`.piece.${opponentColor}`);
    let remainingMoves = false;
    opponentsPieces.forEach((opponentPiece) => {
        if (chessControl.showLegalMoves(opponentPiece, false).length > 0) remainingMoves = true;
    });
    if (!remainingMoves) {
        if (chessControl.isKingInCheck(opponentColor)) chessSocket.checkmate();
        else chessSocket.stalemate();
    }
}

/**  Updates the FEN Field when pieces are moves */
function updateFen() {
    const squares = document.querySelectorAll(".square");
    const current = document.querySelector("#current-fen");
    const turn = document.querySelector("#turn").getAttribute("data-turn");

    let fen = "";
    let spaces = 0;

    squares.forEach((square, index) => {
        if (index % 8 === 0 && index !== 0) {
            if (spaces) fen += spaces;
            fen += "/";
            spaces = 0;
        }

        const piece = square.querySelector(".piece");
        if (piece) {
            if (spaces) fen += spaces;
            spaces = 0;
            let pieceLetter = piece.classList[1] === "knight" ? "n" : piece.classList[1][0];
            if (piece.classList.contains("white")) pieceLetter = pieceLetter.toUpperCase();
            fen += pieceLetter;
        } else spaces++;
    });

    if (spaces) fen += spaces;
    if (turn) fen += ` ${turn}`;
    current.value = fen;

    const playerColor = document.querySelector("#player-color").value;
    if (["white", "black"].includes(playerColor)) chessSocket.sendMove(fen);
}

/** Add event listeners to some elements like buttons, new pieces, fen form... */
function controlListeners() {
    document.querySelector("#play").onclick = chessSocket.startGame;
    document.querySelector("#resign").onclick = chessSocket.resignGame;
    document.querySelector("#draw").onclick = chessSocket.offerDraw;
    document.querySelector("#refuse-draw").onclick = chessSocket.refuseDrawOffer;
    document.querySelector("#accept-draw").onclick = chessSocket.acceptDrawOffer;
    document.querySelector("#close-message").onclick = chessSocket.resetGame;

    const fen = document.querySelector("#current-fen");
    fen.addEventListener("change", () => chessSocket.sendMove(fen.value));
}
