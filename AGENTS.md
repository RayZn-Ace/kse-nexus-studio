# Architecture rules
- Keep Web-Slinger simulation and Canvas scenery in browser-safe game modules; React bridges input and the unchanged progress adapter so tests exercise the same rules as gameplay.
- Keep Web-Slinger verification artifacts within the game directory; browser checks must mock the progress adapter network and never write leaderboard data.