# Tower of Hanoi

A browser-based Tower of Hanoi game built with PHP, MySQL, JavaScript, and CSS.
Features include a daily challenge and leaderboard, customizable keyboard
shortcuts, and light and dark themes.

## Run locally with XAMPP

1. Copy the project folder into `C:\xampp\htdocs\`.
2. Start Apache and MySQL in the XAMPP Control Panel.
3. Import `database/schema.sql` in phpMyAdmin. This creates the `hanoi_game`
   database and its regular and daily score tables.
4. If your MySQL credentials differ from the XAMPP defaults, update `config.php`.
5. Open <http://localhost/tower-of-hanoi/>.

## Keyboard shortcuts

Open **Customize keys** below the game controls to change the keys for towers A,
B, and C, undo, hint, or restart. Shortcuts are saved in the current browser.
Defaults are A/S/D, Z, H, and R. Use single letters, numbers, or arrow keys;
shortcut keys are ignored while typing in text fields.

## Themes

Use the theme button in the header to switch between light and dark themes. The
selected theme is saved in the current browser.

## Daily challenge

Everyone gets the same disk count for each UTC day, cycling through 3–8 disks.
Daily results have their own leaderboard; the current streak is stored in the
player's browser.

## Project files

- `index.php` – game page
- `style.css`, `script.js` – interface and game logic
- `config.php`, `db.php` – database connection
- `api/leaderboard.php` – leaderboard endpoint
- `api/submit.php` – validates and saves scores
- `database/schema.sql` – database schema
