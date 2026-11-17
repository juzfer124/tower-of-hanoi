<?php
require __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'POST required'], 405);
}

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) {
    jsonResponse(['ok' => false, 'error' => 'Invalid request'], 400);
}

// --- Validate input -------------------------------------------------------
$name = trim((string)($in['name'] ?? ''));
$name = preg_replace('/[\p{C}]+/u', '', $name);
$name = mb_substr($name, 0, 20);
$disks = $in['disks'] ?? null;
$time  = $in['time'] ?? null;
$moves = $in['moves'] ?? null;
$daily = ($in['daily'] ?? false) === true;
$challengeDate = $in['challengeDate'] ?? null;

if ($name === '' || !is_int($disks) || $disks < 3 || $disks > 8 ||
    !is_int($time) || $time < 1 || $time > 86400 ||
    !is_array($moves) || count($moves) > 5000) {
    jsonResponse(['ok' => false, 'error' => 'Invalid score data'], 400);
}

if ($daily) {
    $today = new DateTimeImmutable('today', new DateTimeZone('UTC'));
    $expectedDisks = 3 + (intdiv($today->getTimestamp(), 86400) % 6);
    if (!is_string($challengeDate) || $challengeDate !== $today->format('Y-m-d') ||
        $disks !== $expectedDisks) {
        jsonResponse(['ok' => false, 'error' => 'Daily challenge has expired'], 400);
    }
}

// --- Replay the move list so fake scores are rejected ---------------------
$t = [range($disks, 1), [], []];
foreach ($moves as $m) {
    if (!is_array($m) || count($m) !== 2 ||
        !is_int($m[0]) || !is_int($m[1]) ||
        $m[0] < 0 || $m[0] > 2 || $m[1] < 0 || $m[1] > 2 || $m[0] === $m[1] ||
        !$t[$m[0]]) {
        jsonResponse(['ok' => false, 'error' => 'Illegal move list'], 400);
    }
    $disk = end($t[$m[0]]);
    if ($t[$m[1]] && end($t[$m[1]]) < $disk) {
        jsonResponse(['ok' => false, 'error' => 'Illegal move list'], 400);
    }
    array_pop($t[$m[0]]);
    $t[$m[1]][] = $disk;
}
if (count($t[2]) !== $disks) {
    jsonResponse(['ok' => false, 'error' => 'Puzzle not solved'], 400);
}

// --- Save -----------------------------------------------------------------
try {
    $pdo = getDB();
    $count = count($moves);

    if ($daily) {
        $pdo->prepare(
            'INSERT INTO daily_scores (player_name, challenge_date, disks, moves, time_seconds)
             VALUES (?, ?, ?, ?, ?)'
        )->execute([$name, $challengeDate, $disks, $count, $time]);

        $rank = $pdo->prepare(
            'SELECT COUNT(*) + 1 FROM daily_scores
             WHERE challenge_date = ? AND
                   (moves < ? OR (moves = ? AND time_seconds < ?))'
        );
        $rank->execute([$challengeDate, $count, $count, $time]);
    } else {
        $pdo->prepare(
            'INSERT INTO scores (player_name, disks, moves, time_seconds) VALUES (?, ?, ?, ?)'
        )->execute([$name, $disks, $count, $time]);

        $rank = $pdo->prepare(
            'SELECT COUNT(*) + 1 FROM scores
             WHERE disks = ? AND (moves < ? OR (moves = ? AND time_seconds < ?))'
        );
        $rank->execute([$disks, $count, $count, $time]);
    }

    jsonResponse(['ok' => true, 'rank' => (int)$rank->fetchColumn()]);
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'error' => 'Could not save score'], 500);
}
