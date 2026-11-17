<?php
$pageTitle = "Tower of Hanoi | Brain Puzzle";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#f1f5ef" id="themeColor">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap">
    <link rel="stylesheet" href="style.css">
</head>
<body data-theme="light">

<div class="background-glow glow-one"></div>
<div class="background-glow glow-two"></div>

<main class="game-container">

    <header class="topbar">
        <a href="#" class="logo">
            <span class="logo-icon">♜</span>
            <span>HANOI<span class="logo-highlight">.</span></span>
        </a>
        <div class="topbar-actions">
            <div class="top-label"><span class="status-dot"></span>BRAIN CHALLENGE</div>
            <button type="button" class="theme-toggle" id="themeToggleBtn"
                    aria-label="Switch to dark theme" aria-pressed="false">
                <span class="theme-icon" id="themeIcon" aria-hidden="true">☾</span>
                <span id="themeToggleLabel">Dark mode</span>
            </button>
        </div>
    </header>

    <section class="hero">
        <span class="eyebrow">✦ THE CLASSIC LOGIC PUZZLE</span>
        <h1>Master the <span>Tower of Hanoi.</span></h1>
        <p>Move the disks. Think ahead. Solve the puzzle.</p>
    </section>

    <section class="daily-card" aria-labelledby="dailyTitle">
        <div class="daily-copy">
            <span class="daily-eyebrow">TODAY'S SHARED CHALLENGE <span class="daily-date" id="dailyDate">Loading date…</span></span>
            <h2 id="dailyTitle">A new puzzle, every day.</h2>
            <p id="dailyDescription">Everyone gets the same daily disk count. Solve it to start your streak.</p>
        </div>
        <div class="daily-controls">
            <div class="streak-count"><strong id="dailyStreak">0</strong><span>DAY STREAK</span></div>
            <button class="daily-button" id="dailyChallengeBtn" type="button" disabled>Loading challenge…</button>
        </div>
        <p class="daily-status" id="dailyStatus" aria-live="polite"></p>
    </section>

    <section class="game-card">
        <div class="game-toolbar">
            <div class="difficulty">
                <label for="diskCount">DIFFICULTY</label>
                <select id="diskCount">
                    <option value="3">Easy · 3 Disks</option>
                    <option value="4">Normal · 4 Disks</option>
                    <option value="5" selected>Medium · 5 Disks</option>
                    <option value="6">Hard · 6 Disks</option>
                    <option value="7">Expert · 7 Disks</option>
                    <option value="8">Master · 8 Disks</option>
                </select>
            </div>
            <span class="mode-badge" id="modeBadge" hidden>DAILY CHALLENGE</span>
            <button class="reset-button" id="restartBtn">↻ Restart</button>
        </div>

        <div class="stats">
            <div class="stat-box"><span class="stat-icon">👣</span>
                <div><small>MOVES</small><strong id="moveCount">0</strong></div></div>
            <div class="stat-box"><span class="stat-icon">🎯</span>
                <div><small>BEST MOVES</small><strong id="bestMoves">--</strong></div></div>
            <div class="stat-box"><span class="stat-icon">⏱</span>
                <div><small>TIME</small><strong id="timer">00:00</strong></div></div>
        </div>

        <div class="game-instruction" id="instruction" aria-live="polite">
            Select a disk, then select its destination tower.
        </div>

        <div class="board" id="gameBoard">
            <?php
            $towers = [['A', 'START'], ['B', 'AUXILIARY'], ['C', 'DESTINATION']];
            foreach ($towers as $i => [$letter, $sub]): ?>
            <div class="tower-wrapper">
                <div class="tower" data-tower="<?= $i ?>" tabindex="0" role="button"
                     aria-label="Tower <?= $letter ?>">
                    <div class="disks" id="tower<?= $i ?>"></div>
                    <div class="tower-pole"></div>
                    <div class="tower-base"></div>
                </div>
                <span class="tower-label">TOWER <?= $letter ?></span>
                <span class="tower-subtitle"><?= $sub ?></span>
            </div>
            <?php endforeach; ?>
        </div>

        <div class="game-actions">
            <button class="action-button secondary" id="undoBtn" disabled>↶ Undo Move</button>
            <button class="action-button primary" id="hintBtn">✨ Show Hint</button>
        </div>

        <div class="shortcut-toolbar">
            <span>Prefer the keyboard?</span>
            <button type="button" class="shortcut-toggle" id="shortcutsToggleBtn"
                    aria-expanded="false" aria-controls="shortcutPanel">⌨ Customize keys</button>
        </div>
        <section class="shortcut-panel" id="shortcutPanel" aria-label="Custom keyboard shortcuts" hidden>
            <p class="shortcut-help">Choose a key, then press a letter, number, or arrow key. Shortcuts work outside text fields.</p>
            <div class="shortcut-list">
                <div class="shortcut-row"><span>Select Tower A</span><button type="button" class="key-binding" data-shortcut="towerA" aria-label="Change shortcut for Tower A"><kbd id="key-towerA">A</kbd><span>Change</span></button></div>
                <div class="shortcut-row"><span>Select Tower B</span><button type="button" class="key-binding" data-shortcut="towerB" aria-label="Change shortcut for Tower B"><kbd id="key-towerB">S</kbd><span>Change</span></button></div>
                <div class="shortcut-row"><span>Select Tower C</span><button type="button" class="key-binding" data-shortcut="towerC" aria-label="Change shortcut for Tower C"><kbd id="key-towerC">D</kbd><span>Change</span></button></div>
                <div class="shortcut-row"><span>Undo move</span><button type="button" class="key-binding" data-shortcut="undo" aria-label="Change shortcut for Undo move"><kbd id="key-undo">Z</kbd><span>Change</span></button></div>
                <div class="shortcut-row"><span>Show hint</span><button type="button" class="key-binding" data-shortcut="hint" aria-label="Change shortcut for Show hint"><kbd id="key-hint">H</kbd><span>Change</span></button></div>
                <div class="shortcut-row"><span>Restart game</span><button type="button" class="key-binding" data-shortcut="restart" aria-label="Change shortcut for Restart game"><kbd id="key-restart">R</kbd><span>Change</span></button></div>
            </div>
            <div class="shortcut-footer">
                <p class="shortcut-status" id="shortcutStatus" aria-live="polite">Defaults: A / S / D, Z, H, R</p>
                <button type="button" class="shortcut-reset" id="resetShortcutsBtn">Reset defaults</button>
            </div>
        </section>

        <div class="minimum-moves">
            <span>MINIMUM POSSIBLE MOVES</span>
            <strong id="minimumMoves">31</strong>
        </div>
    </section>

    <section class="leaderboard">
        <h2>🏅 <span id="leaderboardHeading">Leaderboard</span> <small id="leaderboardTitle">· 5 Disks</small></h2>
        <div class="table-wrap">
            <table>
                <thead><tr><th>#</th><th>Player</th><th>Moves</th><th>Time</th></tr></thead>
                <tbody id="leaderboardBody">
                    <tr><td colspan="4" class="empty">Loading…</td></tr>
                </tbody>
            </table>
        </div>
    </section>

    <section class="how-to-play">
        <h2>How to play</h2>
        <div class="rules">
            <div class="rule"><span>01</span><p>Move only one disk at a time.</p></div>
            <div class="rule"><span>02</span><p>Only move the top disk of a tower.</p></div>
            <div class="rule"><span>03</span><p>Never place a larger disk on a smaller one.</p></div>
        </div>
    </section>

    <footer>
        <p>HANOI. &copy; <?= date("Y") ?> · Developed by JUZFER VALE · Train your brain, one move at a time.</p>
    </footer>
</main>

<div class="modal-overlay" id="winModal" role="dialog" aria-modal="true" aria-labelledby="winTitle">
    <div class="win-modal">
        <div class="trophy">🏆</div>
        <span class="eyebrow">PUZZLE COMPLETED</span>
        <h2 id="winTitle">Brilliant Work!</h2>
        <p>You successfully conquered the Tower of Hanoi.</p>

        <div class="win-stats">
            <div><small>TOTAL MOVES</small><strong id="finalMoves">0</strong></div>
            <div><small>TIME TAKEN</small><strong id="finalTime">00:00</strong></div>
        </div>

        <div class="save-score">
            <input type="text" id="playerName" maxlength="20" placeholder="Your name" autocomplete="nickname">
            <button class="action-button secondary" id="saveScoreBtn">Save Score</button>
        </div>
        <div class="save-status" id="saveStatus" aria-live="polite"></div>

        <button class="action-button primary" id="playAgainBtn">Play Again ↗</button>
    </div>
</div>

<script src="script.js"></script>
</body>
</html>
