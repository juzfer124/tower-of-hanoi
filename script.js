const $ = (id) => document.getElementById(id);

const towers = [$("tower0"), $("tower1"), $("tower2")];
const towerElements = document.querySelectorAll(".tower");

const diskSelect = $("diskCount");
const themeToggleBtn = $("themeToggleBtn");
const themeToggleLabel = $("themeToggleLabel");
const themeIcon = $("themeIcon");
const themeColor = $("themeColor");
const dailyChallengeBtn = $("dailyChallengeBtn");
const dailyDateDisplay = $("dailyDate");
const dailyDescription = $("dailyDescription");
const dailyStatus = $("dailyStatus");
const dailyStreakDisplay = $("dailyStreak");
const modeBadge = $("modeBadge");
const moveDisplay = $("moveCount");
const bestDisplay = $("bestMoves");
const timerDisplay = $("timer");
const minimumDisplay = $("minimumMoves");
const instruction = $("instruction");
const undoBtn = $("undoBtn");
const hintBtn = $("hintBtn");
const restartBtn = $("restartBtn");
const shortcutsToggleBtn = $("shortcutsToggleBtn");
const shortcutPanel = $("shortcutPanel");
const shortcutStatus = $("shortcutStatus");
const resetShortcutsBtn = $("resetShortcutsBtn");
const winModal = $("winModal");
const playerName = $("playerName");
const saveScoreBtn = $("saveScoreBtn");
const saveStatus = $("saveStatus");

let gameTowers = [[], [], []];
let selectedTower = null;
let moveCount = 0;
let history = [];
let moveLog = [];          // [[from, to], ...] sent to the server for verification
let numberOfDisks = 5;

let startAt = null;        // timestamp of first move
let finalSeconds = 0;
let timerInterval = null;
let gameFinished = false;
let lastDropTower = null;  // tower that just received a disk (for animation)
let scoreSaved = false;
let dailyMode = false;
let dailyChallenge = null;
let previousDiskCount = null;
let dailyStreak = { lastDate: "", count: 0 };
let leaderboardRequestId = 0;
const defaultShortcuts = Object.freeze({
    towerA: "a",
    towerB: "s",
    towerC: "d",
    undo: "z",
    hint: "h",
    restart: "r",
});
let shortcuts = { ...defaultShortcuts };
let shortcutBeingChanged = null;

let bestMoves = {};

const minimumMoves = (n) => Math.pow(2, n) - 1;
const towerName = (i) => String.fromCharCode(65 + i);

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.dataset.theme = theme;
    themeToggleBtn.setAttribute("aria-pressed", String(isDark));
    themeToggleBtn.setAttribute(
        "aria-label",
        `Switch to ${isDark ? "light" : "dark"} theme`
    );
    themeToggleLabel.textContent = isDark ? "Light mode" : "Dark mode";
    themeIcon.textContent = isDark ? "☀" : "☾";
    themeColor.content = isDark ? "#101a19" : "#f1f5ef";
}

function loadTheme() {
    let theme = "light";
    try {
        const saved = localStorage.getItem("hanoiTheme");
        if (saved === "light" || saved === "dark") theme = saved;
    } catch (error) {
        console.warn("Could not load theme preference.", error);
    }
    applyTheme(theme);
}

themeToggleBtn.addEventListener("click", () => {
    const theme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    try {
        localStorage.setItem("hanoiTheme", theme);
    } catch (error) {
        console.warn("Could not save theme preference.", error);
    }
});

/* ---------- Best moves (local) ---------- */
function loadBestMoves() {
    try {
        bestMoves = JSON.parse(localStorage.getItem("hanoiBestMoves") || "{}");
        if (!bestMoves || typeof bestMoves !== "object" || Array.isArray(bestMoves)) bestMoves = {};
    } catch {
        bestMoves = {};
    }
}

function updateBestDisplay() {
    const best = bestMoves[numberOfDisks];
    bestDisplay.textContent = best ? best : "--";
}

function normalizeShortcutKey(key) {
    if (/^[a-z0-9]$/i.test(key)) return key.toLowerCase();
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return key;
    return null;
}

function displayShortcutKey(key) {
    return key.startsWith("Arrow") ? key.replace("Arrow", "") : key.toUpperCase();
}

function renderShortcuts() {
    Object.entries(shortcuts).forEach(([action, key]) => {
        const keyDisplay = $(`key-${action}`);
        if (keyDisplay) keyDisplay.textContent = displayShortcutKey(key);
    });
    document.querySelectorAll(".key-binding").forEach((button) => {
        const isChanging = button.dataset.shortcut === shortcutBeingChanged;
        button.classList.toggle("changing", isChanging);
        button.querySelector("span").textContent = isChanging ? "Press a key…" : "Change";
    });
}

function loadShortcuts() {
    try {
        const saved = JSON.parse(localStorage.getItem("hanoiKeyboardShortcuts") || "null");
        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
            const actions = Object.keys(defaultShortcuts);
            const keys = actions.map((action) => normalizeShortcutKey(saved[action]));
            if (keys.every(Boolean) && new Set(keys).size === actions.length) {
                shortcuts = Object.fromEntries(actions.map((action, index) => [action, keys[index]]));
            } else {
                console.warn("Saved keyboard shortcuts were invalid; using defaults.");
            }
        }
    } catch (error) {
        console.warn("Could not load keyboard shortcuts.", error);
    }
    renderShortcuts();
}

function saveShortcuts() {
    try {
        localStorage.setItem("hanoiKeyboardShortcuts", JSON.stringify(shortcuts));
        shortcutStatus.textContent = "Shortcuts saved on this browser.";
    } catch (error) {
        console.warn("Could not save keyboard shortcuts.", error);
        shortcutStatus.textContent = "Shortcuts changed for this session, but could not be saved.";
    }
}

function assignShortcut(action, key) {
    const conflictingAction = Object.keys(shortcuts).find(
        (name) => name !== action && shortcuts[name] === key
    );
    if (conflictingAction) {
        shortcutStatus.textContent =
            `${displayShortcutKey(key)} is already assigned. Choose a different key.`;
        return false;
    }

    shortcuts[action] = key;
    shortcutBeingChanged = null;
    renderShortcuts();
    saveShortcuts();
    return true;
}

function runShortcut(action) {
    const towerIndex = { towerA: 0, towerB: 1, towerC: 2 }[action];
    if (towerIndex !== undefined) {
        handleTowerClick(towerIndex);
    } else if (action === "undo") {
        undoMove();
    } else if (action === "hint") {
        getHint();
    } else if (action === "restart") {
        initGame();
    }
}

function loadDailyStreak() {
    try {
        const saved = JSON.parse(localStorage.getItem("hanoiDailyStreak") || "{}");
        if (saved && typeof saved.lastDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(saved.lastDate) &&
            Number.isInteger(saved.count) && saved.count >= 0) {
            dailyStreak = { lastDate: saved.lastDate, count: saved.count };
        }
    } catch (error) {
        console.warn("Could not load daily streak.", error);
    }
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86400000)
        .toISOString().slice(0, 10);
    if (dailyStreak.lastDate !== today && dailyStreak.lastDate !== yesterday) {
        dailyStreak.count = 0;
    }
    dailyStreakDisplay.textContent = dailyStreak.count;
}

function recordDailyCompletion(date) {
    if (dailyStreak.lastDate === date) return;

    const previousDate = new Date(Date.parse(`${date}T00:00:00Z`) - 86400000)
        .toISOString().slice(0, 10);
    dailyStreak = {
        lastDate: date,
        count: dailyStreak.lastDate === previousDate ? dailyStreak.count + 1 : 1,
    };
    dailyStreakDisplay.textContent = dailyStreak.count;
    try {
        localStorage.setItem("hanoiDailyStreak", JSON.stringify(dailyStreak));
    } catch (error) {
        console.warn("Could not save daily streak.", error);
    }
}

function formatChallengeDate(date) {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

async function loadDailyChallenge() {
    try {
        const res = await fetch("api/leaderboard.php?mode=daily");
        const data = await res.json();
        if (!data.ok || !data.daily || !Number.isInteger(data.disks) ||
            data.disks < 3 || data.disks > 8 || typeof data.date !== "string") {
            throw new Error(data.error || "Invalid daily challenge");
        }

        dailyChallenge = { date: data.date, disks: data.disks };
        dailyDateDisplay.textContent = formatChallengeDate(data.date);
        dailyDescription.textContent =
            `Today's shared puzzle has ${data.disks} disks. Solve it to start your streak.`;
        dailyStatus.textContent = "A new challenge arrives at midnight UTC.";
        dailyChallengeBtn.disabled = false;
        if (dailyMode) {
            diskSelect.value = String(data.disks);
            initGame();
        }
    } catch (error) {
        const now = new Date();
        const date = now.toISOString().slice(0, 10);
        const disks = 3 + (Math.floor(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
        ) / 86400000) % 6);
        dailyChallenge = { date, disks };
        dailyDateDisplay.textContent = formatChallengeDate(date);
        dailyDescription.textContent =
            `Today's shared puzzle has ${disks} disks. Solve it to start your streak.`;
        dailyStatus.textContent = "Daily leaderboard unavailable. You can still play today's challenge.";
        dailyChallengeBtn.disabled = false;
    }
}

/* ---------- Timer (timestamp based, so background tabs stay accurate) ---------- */
function formatTime(value) {
    const m = Math.floor(value / 60);
    const s = value % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function elapsedSeconds() {
    return startAt ? Math.floor((Date.now() - startAt) / 1000) : 0;
}

function startTimer() {
    if (startAt || gameFinished) return;
    startAt = Date.now();
    timerInterval = setInterval(() => {
        timerDisplay.textContent = formatTime(elapsedSeconds());
    }, 500);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

/* ---------- Game setup ---------- */
function initGame() {
    stopTimer();
    numberOfDisks = dailyMode && dailyChallenge
        ? dailyChallenge.disks
        : parseInt(diskSelect.value, 10);
    diskSelect.disabled = dailyMode;
    modeBadge.hidden = !dailyMode;
    dailyChallengeBtn.textContent = dailyMode ? "Exit daily challenge" : "Play today's challenge";

    gameTowers = [
        Array.from({ length: numberOfDisks }, (_, i) => numberOfDisks - i),
        [],
        [],
    ];

    moveCount = 0;
    history = [];
    moveLog = [];
    selectedTower = null;
    lastDropTower = null;
    startAt = null;
    finalSeconds = 0;
    gameFinished = false;
    scoreSaved = false;

    winModal.classList.remove("show");
    moveDisplay.textContent = "0";
    timerDisplay.textContent = "00:00";
    minimumDisplay.textContent = minimumMoves(numberOfDisks);
    instruction.textContent = "Select a disk, then select its destination tower.";
    undoBtn.disabled = true;

    renderGame();
    updateBestDisplay();
    loadLeaderboard();
}

function renderGame() {
    towers.forEach((tower, towerIndex) => {
        tower.innerHTML = "";
        const stack = gameTowers[towerIndex];

        stack.forEach((diskSize, index) => {
            const disk = document.createElement("div");
            disk.className = `disk disk-${diskSize}`;
            disk.style.width = 25 + (diskSize / numberOfDisks) * 70 + "%";

            if (index === stack.length - 1) {
                if (selectedTower === towerIndex) disk.classList.add("selected-disk");
                if (lastDropTower === towerIndex) disk.classList.add("drop");
            }
            tower.appendChild(disk);
        });
    });
    lastDropTower = null;

    towerElements.forEach((tower, index) => {
        tower.classList.toggle("selected", selectedTower === index);
        tower.classList.toggle(
            "potential",
            selectedTower !== null && selectedTower !== index && canMove(selectedTower, index)
        );
    });
}

function canMove(from, to) {
    if (from === to) return false;
    const source = gameTowers[from];
    const destination = gameTowers[to];
    if (source.length === 0) return false;
    const moving = source[source.length - 1];
    const top = destination[destination.length - 1];
    return !top || moving < top;
}

/* ---------- Moves ---------- */
function handleTowerClick(towerIndex) {
    if (gameFinished) return;

    if (selectedTower === null) {
        if (gameTowers[towerIndex].length === 0) {
            instruction.textContent = "This tower is empty. Select a tower with a disk.";
            return;
        }
        selectedTower = towerIndex;
        instruction.textContent = "Now select the tower where you want to move the disk.";
        renderGame();
        return;
    }

    if (selectedTower === towerIndex) {
        selectedTower = null;
        instruction.textContent = "Selection cancelled. Choose another disk.";
        renderGame();
        return;
    }

    if (!canMove(selectedTower, towerIndex)) {
        instruction.textContent = "Invalid move! A larger disk cannot go on a smaller disk.";
        selectedTower = null;
        renderGame();
        return;
    }

    makeMove(selectedTower, towerIndex);
}

function makeMove(from, to) {
    startTimer();

    history.push({ towers: gameTowers.map((t) => [...t]), moveCount });
    moveLog.push([from, to]);

    gameTowers[to].push(gameTowers[from].pop());

    moveCount++;
    moveDisplay.textContent = moveCount;
    selectedTower = null;
    lastDropTower = to;
    undoBtn.disabled = false;
    instruction.textContent = "Great move! Keep going.";

    renderGame();
    checkWin();
}

function undoMove() {
    if (history.length === 0 || gameFinished) return;

    const previous = history.pop();
    moveLog.pop();
    gameTowers = previous.towers;
    moveCount = previous.moveCount;
    moveDisplay.textContent = moveCount;
    selectedTower = null;
    undoBtn.disabled = history.length === 0;
    instruction.textContent = "Previous move restored.";
    renderGame();
}

/* ---------- Hint: optimal next move from the CURRENT position ---------- */
function nextMove(disk, target) {
    if (disk === 0) return null;
    const src = gameTowers.findIndex((t) => t.includes(disk));
    if (src === target) return nextMove(disk - 1, target);
    const aux = 3 - src - target;
    return nextMove(disk - 1, aux) || [src, target];
}

function getHint() {
    if (gameFinished) return;
    const move = nextMove(numberOfDisks, 2);
    if (move) {
        instruction.textContent =
            `Hint: Move a disk from Tower ${towerName(move[0])} to Tower ${towerName(move[1])}.`;
    }
}

/* ---------- Win ---------- */
function checkWin() {
    if (gameTowers[2].length !== numberOfDisks) return;

    gameFinished = true;
    finalSeconds = Math.max(1, elapsedSeconds());
    stopTimer();
    timerDisplay.textContent = formatTime(finalSeconds);

    const currentBest = bestMoves[numberOfDisks];
    if (!currentBest || moveCount < currentBest) {
        bestMoves[numberOfDisks] = moveCount;
        try {
            localStorage.setItem("hanoiBestMoves", JSON.stringify(bestMoves));
        } catch (error) {
            console.warn("Could not save best score.", error);
        }
    }
    updateBestDisplay();

    $("finalMoves").textContent = moveCount;
    $("finalTime").textContent = formatTime(finalSeconds);
    instruction.textContent = "Puzzle completed! Congratulations!";
    undoBtn.disabled = true;
    if (dailyMode && dailyChallenge) {
        const isCurrentChallenge = dailyChallenge.date === new Date().toISOString().slice(0, 10);
        if (isCurrentChallenge) {
            recordDailyCompletion(dailyChallenge.date);
            dailyStatus.textContent = `Daily challenge complete! Your streak is ${dailyStreak.count} day${dailyStreak.count === 1 ? "" : "s"}.`;
        } else {
            dailyStatus.textContent = "This daily challenge has expired. Start today's challenge to continue your streak.";
        }
    }

    saveStatus.textContent = "";
    saveScoreBtn.disabled = false;
    try { playerName.value = localStorage.getItem("hanoiPlayerName") || ""; } catch {}

    setTimeout(() => {
        winModal.classList.add("show");
        playerName.focus();
    }, 400);
}

/* ---------- Leaderboard (PHP + MySQL) ---------- */
async function loadLeaderboard() {
    const body = $("leaderboardBody");
    const requestId = ++leaderboardRequestId;
    $("leaderboardHeading").textContent = dailyMode ? "Daily Leaderboard" : "Leaderboard";
    $("leaderboardTitle").textContent = dailyMode
        ? `· ${dailyChallenge ? formatChallengeDate(dailyChallenge.date) : "Today"}`
        : `· ${numberOfDisks} Disks`;

    const message = (text) => {
        body.innerHTML = "";
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.className = "empty";
        td.textContent = text;
        tr.appendChild(td);
        body.appendChild(tr);
    };

    try {
        const url = dailyMode
            ? "api/leaderboard.php?mode=daily"
            : `api/leaderboard.php?disks=${numberOfDisks}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        if (requestId !== leaderboardRequestId) return;

        if (data.scores.length === 0) {
            message("No scores yet. Be the first!");
            return;
        }

        body.innerHTML = "";
        data.scores.forEach((row, i) => {
            const tr = document.createElement("tr");
            const cells = [i + 1, row.player_name, row.moves, formatTime(Number(row.time_seconds))];
            cells.forEach((value, c) => {
                const td = document.createElement("td");
                if (c === 0) td.className = "rank";
                td.textContent = value;   // textContent keeps names safe from XSS
                tr.appendChild(td);
            });
            body.appendChild(tr);
        });
    } catch {
        if (requestId === leaderboardRequestId) {
            message("Leaderboard unavailable. Check the database setup.");
        }
    }
}

async function saveScore() {
    if (!gameFinished || scoreSaved) return;

    const name = playerName.value.trim();
    if (!name) {
        saveStatus.textContent = "Please enter your name.";
        playerName.focus();
        return;
    }

    try { localStorage.setItem("hanoiPlayerName", name); } catch {}

    saveScoreBtn.disabled = true;
    saveStatus.textContent = "Saving…";

    try {
        const res = await fetch("api/submit.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                disks: numberOfDisks,
                time: finalSeconds,
                moves: moveLog,
                daily: dailyMode,
                challengeDate: dailyMode && dailyChallenge ? dailyChallenge.date : null,
            }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        scoreSaved = true;
        saveStatus.textContent = dailyMode
            ? `Saved! You are ranked #${data.rank} in today's daily challenge.`
            : `Saved! You are ranked #${data.rank} on ${numberOfDisks} disks.`;
        loadLeaderboard();
    } catch (error) {
        saveScoreBtn.disabled = false;
        saveStatus.textContent = "Could not save score. Is the database set up?";
    }
}

/* ---------- Events ---------- */
towerElements.forEach((tower, index) => {
    tower.addEventListener("click", () => handleTowerClick(index));
    tower.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTowerClick(index);
        }
    });
});

undoBtn.addEventListener("click", undoMove);
hintBtn.addEventListener("click", getHint);
restartBtn.addEventListener("click", initGame);
dailyChallengeBtn.addEventListener("click", () => {
    if (dailyMode) {
        dailyMode = false;
        if (previousDiskCount !== null) diskSelect.value = previousDiskCount;
        previousDiskCount = null;
        initGame();
        return;
    }
    if (!dailyChallenge) return;
    dailyMode = true;
    previousDiskCount = diskSelect.value;
    diskSelect.value = String(dailyChallenge.disks);
    initGame();
});
diskSelect.addEventListener("change", () => {
    dailyMode = false;
    previousDiskCount = null;
    initGame();
});
shortcutsToggleBtn.addEventListener("click", () => {
    const opening = shortcutPanel.hidden;
    shortcutPanel.hidden = !opening;
    shortcutsToggleBtn.setAttribute("aria-expanded", String(opening));
    if (opening) $("key-towerA").closest("button").focus();
});
document.querySelectorAll(".key-binding").forEach((button) => {
    button.addEventListener("click", () => {
        shortcutBeingChanged = button.dataset.shortcut;
        shortcutStatus.textContent = "Press a letter, number, or arrow key. Escape cancels.";
        renderShortcuts();
    });
});
resetShortcutsBtn.addEventListener("click", () => {
    shortcutBeingChanged = null;
    shortcuts = { ...defaultShortcuts };
    renderShortcuts();
    saveShortcuts();
    shortcutStatus.textContent = "Default shortcuts restored.";
});
$("playAgainBtn").addEventListener("click", initGame);
saveScoreBtn.addEventListener("click", saveScore);
playerName.addEventListener("keydown", (e) => { if (e.key === "Enter") saveScore(); });

document.addEventListener("keydown", (event) => {
    if (shortcutBeingChanged) {
        event.preventDefault();
        if (event.key === "Escape") {
            shortcutBeingChanged = null;
            renderShortcuts();
            shortcutStatus.textContent = "Shortcut change cancelled.";
            return;
        }
        if (event.ctrlKey || event.altKey || event.metaKey) {
            shortcutStatus.textContent = "Use a key without Ctrl, Alt, or Command.";
            return;
        }
        const key = normalizeShortcutKey(event.key);
        if (!key) {
            shortcutStatus.textContent = "Use a letter, number, or arrow key. Escape cancels.";
            return;
        }
        assignShortcut(shortcutBeingChanged, key);
        return;
    }

    if (event.key === "Escape") {
        winModal.classList.remove("show");
        return;
    }
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || gameFinished ||
        winModal.classList.contains("show")) return;

    const target = event.target;
    if (target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select"))) return;

    const key = normalizeShortcutKey(event.key);
    const action = Object.keys(shortcuts).find((name) => shortcuts[name] === key);
    if (action) {
        event.preventDefault();
        runShortcut(action);
    }
});
winModal.addEventListener("click", (e) => {
    if (e.target === winModal) winModal.classList.remove("show");
});

loadTheme();
loadDailyStreak();
loadBestMoves();
loadShortcuts();
initGame();
loadDailyChallenge();
