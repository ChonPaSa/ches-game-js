export let allLegalMoves = [];

const castleRights = {
    white: { king: true, krook: true, qrook: true },
    black: { king: true, krook: true, qrook: true },
};

export function showLegalMoves(piece, ui = true) {
    removeLegalMoves();
    const squares = document.querySelectorAll("#board .square");
    squares.forEach((square) => square.classList.remove("selected"));

    if (piece.parentElement && ui) piece.parentElement.classList.add("selected");

    const color = piece.classList[2];
    allLegalMoves = generateMoves(piece.classList[1], color, piece.parentElement.id);
    const filteredMoves = [];
    //Check when the king is in check if the next move will be out of check
    for (const move of allLegalMoves) {
        // Create a backup of current board, move and rollback if still in check
        const originalPiece = document.querySelector("#" + move + " .piece");
        const originalSquare = piece.parentElement;
        clearSquare(document.querySelector("#" + move));
        document.querySelector("#" + move).appendChild(piece);
        if (!isKingInCheck(color)) filteredMoves.push(move);
        clearSquare(document.querySelector("#" + move));
        originalSquare.appendChild(piece);
        if (originalPiece) document.querySelector("#" + move).appendChild(originalPiece);
    }
    allLegalMoves = filteredMoves;

    if (ui) {
        allLegalMoves.forEach((move) => {
            const targetSquare = document.querySelector("#" + move);
            const legal = document.createElement("span");
            legal.classList.add("legal-move");
            targetSquare.appendChild(legal);
        });
    }

    return allLegalMoves;
}

function generateDirectionalMoves(file, rank, color, directions) {
    const moves = [];
    directions.forEach(([dx, dy]) => {
        for (let i = 1; i <= 8; i++) {
            const target = convertToSquare(file + dx * i, rank + dy * i);
            if (!target || isSquareOccupied(target, color)) break;
            moves.push(target);
            if (isSquareOccupied(target, color === "white" ? "black" : "white")) break;
        }
    });
    return moves;
}

function generateKnightMoves(file, rank, color) {
    const knightMoves = [
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
    ];
    return knightMoves.map(([dx, dy]) => convertToSquare(file + dx, rank + dy)).filter((target) => target && !isSquareOccupied(target, color));
}

function generateKingMoves(file, rank, color) {
    const kingMoves = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
    ];
    let moves = kingMoves.map(([dx, dy]) => convertToSquare(file + dx, rank + dy)).filter((target) => target && !isSquareOccupied(target, color));

    if (castleRights[color].king) {
        if (castleRights[color].krook && canCastleKingside(file, rank, color)) {
            moves.push(color === "white" ? "g1" : "g8");
        }
        if (castleRights[color].qrook && canCastleQueenside(file, rank, color)) {
            moves.push(color === "white" ? "c1" : "c8");
        }
    }

    return moves;
}

function canCastleKingside(file, rank, color) {
    const kingFile = 5;
    const squaresBetween = [convertToSquare(kingFile + 1, rank), convertToSquare(kingFile + 2, rank)];
    return (
        squaresBetween.every((square) => !isSquareOccupied(square, color)) && !isKingInCheck(color) && squaresBetween.every((square) => !isSquareUnderAttack(square, color))
    );
}

// Pawn move logic
function generatePawnMoves(file, rank, color) {
    let moves = [];
    const forward = color === "white" ? 1 : -1;
    const opponentColor = color === "white" ? "black" : "white";

    // Regular move forward
    let target = convertToSquare(file, rank + forward);
    if (target && !isSquareOccupied(target, color) && !isSquareOccupied(target, opponentColor)) {
        moves.push(target);
        // Double move forward from the starting rank
        if ((color === "white" && rank === 2) || (color === "black" && rank === 7)) {
            target = convertToSquare(file, rank + 2 * forward);
            if (target && !isSquareOccupied(target, color) && !isSquareOccupied(target, opponentColor)) {
                moves.push(target);
            }
        }
    }

    // Diagonal captures
    [
        [1, forward],
        [-1, forward],
    ].forEach(([dx, dy]) => {
        target = convertToSquare(file + dx, rank + dy);
        if (target && isSquareOccupied(target, opponentColor)) {
            moves.push(target);
        }
    });

    return moves;
}

function generateMoves(pieceName, color, currentSquare) {
    const [file, rank] = currentSquare.split("");
    const fileNum = file.charCodeAt(0) - 96;
    const rankNum = Number(rank);
    const opponentColor = color === "white" ? "black" : "white";

    switch (pieceName) {
        case "pawn":
            return generatePawnMoves(fileNum, rankNum, color);
        case "rook":
            return generateDirectionalMoves(fileNum, rankNum, color, [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ]);
        case "bishop":
            return generateDirectionalMoves(fileNum, rankNum, color, [
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1],
            ]);
        case "queen":
            return generateDirectionalMoves(fileNum, rankNum, color, [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1],
            ]);
        case "knight":
            return generateKnightMoves(fileNum, rankNum, color);
        case "king":
            return generateKingMoves(fileNum, rankNum, color);
        default:
            return [];
    }
}

export function removeLegalMoves() {
    document.querySelectorAll("#board .legal-move").forEach((move) => move.remove());
}

export function clearSquare(square) {
    square.innerHTML = "";
}

function convertToSquare(file, rank) {
    if (file < 1 || file > 8 || rank < 1 || rank > 8) return null;
    return String.fromCharCode(96 + file) + rank;
}

function isSquareOccupied(square, color) {
    return document.querySelector("#" + square + " > ." + color);
}

export function updateCastleRights(square, color, piece) {
    if (color === "white") {
        if (piece === "king" && square === "e1") castleRights.white.king = false;
        if (piece === "rook") {
            if (square === "a1") castleRights.white.qrook = false;
            if (square === "h1") castleRights.white.krook = false;
        }
    } else {
        if (piece === "king" && square === "e8") castleRights.black.king = false;
        if (piece === "rook") {
            if (square === "a8") castleRights.black.qrook = false;
            if (square === "h8") castleRights.black.krook = false;
        }
    }
}

export function isKingInCheck(color) {
    const king = document.querySelector(".king." + color);
    if (king) {
        const kingPosition = king.parentElement.id;
        const opponentColor = color === "white" ? "black" : "white";
        const opponentPieces = document.querySelectorAll("#board ." + opponentColor);

        return [...opponentPieces].some((piece) => {
            const pieceName = [...piece.classList].find((name) => name !== opponentColor && name !== "piece");
            const piecePosition = piece.parentElement.id;
            return generateMoves(pieceName, opponentColor, piecePosition).includes(kingPosition);
        });
    }
    return false;
}

function canCastleQueenside(file, rank, color) {
    const kingFile = 5;
    const squaresBetween = [convertToSquare(kingFile - 1, rank), convertToSquare(kingFile - 2, rank), convertToSquare(kingFile - 3, rank)];
    return (
        squaresBetween.every((square) => !isSquareOccupied(square, color)) &&
        !isKingInCheck(color) &&
        squaresBetween.slice(0, 2).every((square) => !isSquareUnderAttack(square, color))
    );
}

function isSquareUnderAttack(square, color) {
    const opponentColor = color === "white" ? "black" : "white";
    const opponentPieces = document.querySelectorAll("#board ." + opponentColor);

    return [...opponentPieces].some((piece) => {
        const pieceName = [...piece.classList].find((name) => name !== opponentColor && name !== "piece");
        const piecePosition = piece.parentElement.id;
        return generateMoves(pieceName, opponentColor, piecePosition).includes(square);
    });
}
