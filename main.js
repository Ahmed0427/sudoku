const boardElement = document.querySelector(".board");
const numberElements = document.querySelectorAll(".game-numbers span");

let notCorrectCellsCount, currentActiveCell, sudokuPuzzle, solvedSudokuPuzzle, 
    timerIntervalId, isNotesActive = false, hintsCount = 3, mistakesCount = 0, currentTimeInSeconds = 0;

function showOverlay() {
    document.querySelector(".overlay").classList.add("active");
}

function removeOverlay() {
    document.querySelector(".overlay").classList.remove("active");
}

function updateTimer() {
    currentTimeInSeconds++;
    if (currentTimeInSeconds === 60 * 100) currentTimeInSeconds = 1;

    const minutes = String(Math.floor(currentTimeInSeconds / 60)).padStart(2, '0');
    const seconds = String(currentTimeInSeconds % 60).padStart(2, '0');

    document.querySelector(".time span").innerHTML = `${minutes}:${seconds}`;
}

function setActiveCell(event) {
    [...document.getElementsByClassName("cell")].forEach(cell => cell.classList.remove("active", "related"));

    const cell = event ? event.target.parentNode : document.getElementsByClassName("0-0")[0];
    const [x, y] = cell.classList[0].split('-').map(num => parseInt(num));

    function getRelatedCells() {
        const relatedCells = [];
        const baseRow = Math.floor(x / 3) * 3;
        const baseCol = Math.floor(y / 3) * 3;

        for (let i = 0; i < 9; i++) {
            relatedCells.push(`${baseRow + Math.floor(i / 3)}-${baseCol + (i % 3)}`);
            relatedCells.push(`${x}-${i}`);
            relatedCells.push(`${i}-${y}`);
        }
        return relatedCells;
    }

    getRelatedCells().forEach(className => {
        document.getElementsByClassName(className)[0].classList.add("related");
    });

    document.getElementsByClassName(`${x}-${y}`)[0].classList.add("active");
    currentActiveCell = cell;
}

function generateBoardCells() {
    boardElement.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let cell = document.createElement("div");
            let answer = document.createElement("div");
            answer.classList.add("answer");
            cell.appendChild(answer);

            if (sudokuPuzzle[i][j] !== '.') {
                answer.innerHTML = sudokuPuzzle[i][j];
                answer.classList.add("correct");
            }

            cell.classList.add(`${i}-${j}`, "cell");
            for (let k = 0; k < 9; k++) {
                let noteNum = document.createElement("span");
                noteNum.classList.add(`${k + 1}`);
                cell.appendChild(noteNum);
            }

            cell.addEventListener('click', setActiveCell);
            if (j === 2 || j === 5) cell.classList.add("thicker-right");
            if (i === 2 || i === 5) cell.classList.add("thicker-bottom");

            boardElement.appendChild(cell);
        }
    }
    setActiveCell(null);
}

function generateSudokuPuzzle() {
    let board = Array(9).fill().map(() => Array(9).fill('.'));

    function shuffle(str) {
        const arr = str.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }

    const randCharList = shuffle("123456789");

    function isValidMove(board, x, y, c) {
        for (let i = 0; i < 9; i++) {
            let col = Math.floor(y / 3) * 3 + (i % 3);
            let row = Math.floor(x / 3) * 3 + Math.floor(i / 3);
            if (board[row][col] === c || board[i][y] === c || board[x][i] === c) return false;
        }
        return true;
    }

    function solveSudoku(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] !== '.') continue;
                for (let c = 0; c < 9; c++) {
                    let randChar = randCharList[c];
                    if (isValidMove(board, i, j, randChar)) {
                        board[i][j] = randChar;
                        if (solveSudoku(board)) return true;
                        board[i][j] = '.';
                    }
                }
                return false;
            }
        }
        return true;
    }

    solveSudoku(board);
    let solvedBoard = board.map(row => [...row]);

    let emptyCount;
    const spanDifficulty = document.querySelector(".game-info .difficulty span");
    const difficulty = spanDifficulty.innerHTML.trim().toLowerCase();

    if (difficulty === "easy") emptyCount = 30;
    if (difficulty === "medium") emptyCount = 40;
    if (difficulty === "hard") emptyCount = 50;

    notCorrectCellsCount = emptyCount;

    while (emptyCount > 0) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);
        if (board[row][col] !== '.') {
            board[row][col] = '.';
            emptyCount--;
        }
    }

    solvedSudokuPuzzle = solvedBoard;
    sudokuPuzzle = board;
}

function updateMistakesCounter() {
    document.querySelector(".mistakes").innerHTML = `Mistakes:<span>${mistakesCount}/3</span>`;
}

function setAndHandleNumberEvents() {
    numberElements.forEach(element => element.addEventListener("click", (event) => {
        const answerElement = currentActiveCell.querySelector(".answer");
        if (answerElement.classList.contains("correct")) return;

        const clickedNum = event.target.classList[0];

        if (isNotesActive) {
            answerElement.innerHTML = "";
            const noteNum = currentActiveCell.getElementsByClassName(clickedNum)[0];
            noteNum.innerHTML = noteNum.innerHTML === "" ? clickedNum : "";
        } else {
            currentActiveCell.querySelectorAll("span").forEach(span => span.innerHTML = "");
            answerElement.innerHTML = clickedNum;

            const [x, y] = currentActiveCell.classList[0].split('-').map(num => parseInt(num));
            if (clickedNum !== solvedSudokuPuzzle[x][y]) {
                answerElement.classList.add("wrong");
                mistakesCount++;
                updateMistakesCounter();

                if (mistakesCount === 3) showOverlay();
            } else {
                answerElement.classList.add("correct");
                answerElement.classList.remove("wrong");

                if (--notCorrectCellsCount === 0) showOverlay();
            }
        }
    }));
}

function handleTimerPausePlay() {
    document.querySelector(".time i").addEventListener("click", (event) => {
        if (event.target.classList.contains("fa-circle-play")) {
            timerIntervalId = setInterval(updateTimer, 1000);
        } else {
            clearInterval(timerIntervalId);
        }

        event.target.classList.toggle("fa-circle-pause");
        event.target.classList.toggle("fa-circle-play");
        document.querySelectorAll(".cell .answer").forEach(cell => cell.classList.toggle("pause"));
    });
}

function handleNewGameBtnClick() {
    const newGameBtn = document.querySelector(".new-game");
    const selectDifficultyElement = document.querySelector(".select-difficulty");
    newGameBtn.addEventListener("click", () => {
        selectDifficultyElement.classList.toggle("active");
    });

    selectDifficultyElement.querySelectorAll("*").forEach(element => {
        element.addEventListener("click", (e) => {
            const spanDifficulty = document.querySelector(".game-info .difficulty span");
            spanDifficulty.innerHTML = e.target.innerHTML;
            resetGame();
        });
    });
}

function handleEraseClick() {
    const eraseElement = document.querySelector(".game-controls .erase");
    eraseElement.addEventListener("click", () => {
        const answerElement = currentActiveCell.querySelector(".answer");
        if (!answerElement.classList.contains("correct")) answerElement.innerHTML = "";
    });
}

function updateHintsCounter() {
    const hintCountElement = document.querySelector(".game-controls .hint .count");
    hintCountElement.innerHTML = `${hintsCount}`;
}

function handleHintsClick() {
    const hintElement = document.querySelector(".game-controls .hint");
    hintElement.addEventListener("click", () => {
        const answerElement = currentActiveCell.querySelector(".answer");
        if (answerElement.classList.contains("correct") || hintsCount === 0) return;

        currentActiveCell.querySelectorAll("span").forEach(span => span.innerHTML = "");
        const [x, y] = currentActiveCell.classList[0].split('-').map(num => parseInt(num));
        answerElement.innerHTML = solvedSudokuPuzzle[x][y];

        answerElement.classList.add("correct");
        answerElement.classList.remove("wrong");

        if (--notCorrectCellsCount === 0) showOverlay();

        hintsCount--;
        updateHintsCounter();
    });
}

function resetGame() {
    removeOverlay();

    const timeIcon = document.querySelector(".time i");
    if (timeIcon.classList.contains("fa-circle-play")) timeIcon.click();

    generateSudokuPuzzle();
    generateBoardCells();

    isNotesActive = false;
    document.querySelector(".note").classList.remove("active");

    currentTimeInSeconds = 0;
    clearInterval(timerIntervalId);
    document.querySelector(".time span").innerHTML = `00:00`;
    timerIntervalId = setInterval(updateTimer, 1000);

    mistakesCount = 0;
    updateMistakesCounter();

    hintsCount = 3;
    updateHintsCounter();
}

function main() {
    handleNewGameBtnClick();
    generateSudokuPuzzle();
    generateBoardCells();

    setAndHandleNumberEvents();

    timerIntervalId = setInterval(updateTimer, 1000);

    handleTimerPausePlay();
    handleEraseClick();
    handleHintsClick();

    document.querySelector(".note").addEventListener("click", (e) => {
        e.target.classList.toggle("active");
        isNotesActive = !isNotesActive;
    });
}

main();
