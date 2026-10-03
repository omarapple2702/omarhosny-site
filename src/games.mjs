// Central data for Omar's existing games, hosted on their own sites. URLs and descriptions live ONLY here.
// `shows` lists what each page's own text says (inspected 3 October 2026). Nothing is described that the page does not show.
// `visual` picks the original illustration used on the launcher card; it is decoration, not a claim about how the game is built.
export const EXTERNAL_GAMES = [
  {
    id: 'omar-click', name: 'Omar Click', url: 'https://omarclick.vercel.app/', category: 'Clicker', visual: 'click', status: 'Live', external: true,
    siteTitle: 'Clicker Game',
    summary: 'A clicker game: press the Click Me button and watch the counter go up.',
    shows: ['A counter that starts at 0', 'A “Click Me!” button'],
  },
  {
    id: '2048-omar', name: '2048 Omar', url: 'https://2048omar.vercel.app/', category: 'Puzzle', visual: 'tiles', status: 'Live', external: true,
    siteTitle: '2048 Drop',
    summary: 'A drop-style take on 2048. Drop numbered tiles and merge matching ones into bigger numbers before the stack crosses the top line.',
    shows: ['Tap or click to drop, drag to aim', 'Score, Best and a Next tile', 'A Game Over screen with Try Again'],
  },
  {
    id: 'neon-rush', name: 'Neon Rush', url: 'https://neonrush-phi.vercel.app/', category: 'Arcade', visual: 'tunnel', status: 'Live', external: true,
    siteTitle: 'Mini Game',
    summary: 'A score-based mini game with a Play Again button.',
    shows: ['A live score', 'A Play Again button'],
  },
  {
    id: 'survival-dodging', name: 'Survival Dodging Game', url: 'https://survivaldodginggame.vercel.app/', category: 'Arcade', visual: 'hazards', status: 'Live', external: true,
    siteTitle: 'Mini Game',
    summary: 'A score-based survival and dodging game. It opens on a Ready? screen with a Play button.',
    shows: ['A live score', 'A Ready? screen with a Play button'],
  },
  {
    id: 'chess-omar', name: 'Chess Omar', url: 'https://chessomar.vercel.app/', category: 'Board game', visual: 'chess', status: 'Live', external: true,
    siteTitle: 'Chess',
    summary: 'Chess for two players on one board, or against the computer on Easy, Medium or Hard.',
    shows: ['Play 2 players or vs computer', 'Choose Easy, Medium or Hard, and play as White or Black', 'Click a piece to see its legal moves', 'Move list, captured pieces, undo move, flip board and quit'],
  },
  {
    id: 'flappy-bird-omar', name: 'Flappy Bird Omar', url: 'https://flappybirdomar.vercel.app/', category: 'Arcade', visual: 'sky', status: 'Live', external: true,
    siteTitle: 'Flappy Bird',
    summary: 'Omar’s take on Flappy Bird, with a button for sound.',
    shows: ['A sound on/off button'],
  },
  {
    id: 'click-the-button', name: 'Click the Button', url: 'https://click-the-button-rose.vercel.app/', category: 'Clicker', visual: 'dodge', status: 'Live', external: true,
    siteTitle: 'Click The Button',
    summary: 'Get 10 clicks. The button gets away from you fast, and on desktop it dodges your cursor once you are a few clicks in.',
    shows: ['A clicks counter out of 10', 'A best score', 'A Play Again button'],
  },
  {
    id: 'omar-quiz', name: 'Omar Quiz', url: 'https://omargame.vercel.app/', category: 'Quiz', visual: 'quiz', status: 'Live', external: true, quiz: true,
    siteTitle: 'Omar’s Ultimate Quiz',
    summary: 'My quiz project, Omar’s Ultimate Quiz. It has a Quiz Finished screen with a Restart Quiz button.',
    shows: ['A Quiz Finished screen', 'A Restart Quiz button'],
  },
];
export const hostOf = (u) => new URL(u).host;
