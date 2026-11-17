<?php
require __DIR__ . '/../db.php';

$disks = filter_input(INPUT_GET, 'disks', FILTER_VALIDATE_INT);
$daily = ($_GET['mode'] ?? '') === 'daily';
$today = new DateTimeImmutable('today', new DateTimeZone('UTC'));
$dailyDisks = 3 + (intdiv($today->getTimestamp(), 86400) % 6);

if ($daily) {
    $disks = $dailyDisks;
}

if ($disks === false || $disks === null || $disks < 3 || $disks > 8) {
    jsonResponse(['ok' => false, 'error' => 'Invalid disk count'], 400);
}

try {
    if ($daily) {
        $stmt = getDB()->prepare(
            'SELECT player_name, moves, time_seconds, created_at
             FROM daily_scores WHERE challenge_date = ?
             ORDER BY moves ASC, time_seconds ASC, id ASC
             LIMIT 10'
        );
        $stmt->execute([$today->format('Y-m-d')]);
        jsonResponse([
            'ok' => true,
            'daily' => true,
            'date' => $today->format('Y-m-d'),
            'disks' => $dailyDisks,
            'scores' => $stmt->fetchAll(),
        ]);
    }

    $stmt = getDB()->prepare(
        'SELECT player_name, moves, time_seconds, created_at
         FROM scores WHERE disks = ?
         ORDER BY moves ASC, time_seconds ASC, id ASC
         LIMIT 10'
    );
    $stmt->execute([$disks]);
    jsonResponse(['ok' => true, 'scores' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'error' => 'Database unavailable'], 500);
}
