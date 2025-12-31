/*************************************************
 * GLOBAL VARIABLES
 *************************************************/

let money = 10.0;
let broomFlipped = false;

/* Screens & Game states */
let bjDeck, bjPlayer, bjDealer, bjBet, bjOver;
let pkDeck, pkPlayer, pkDealer, pkBet, pkActive;

/*************************************************
 * COMMON FUNCTIONS
 *************************************************/

// Update all money displays
function updateMoneyDisplay() {
  document.querySelectorAll("[id$='money']").forEach((el) => {
    el.textContent = `Money: $${money.toFixed(2)}`;
  });
}

// Screen navigation
function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function backToMenu() {
  showScreen("start-screen");
  updateMoneyDisplay();
}

// Broom cleaning + animation
function cleanFloors() {
  money += 0.01;
  updateMoneyDisplay();
  const broom = document.getElementById("broom");
  broomFlipped = !broomFlipped;
  broom.style.transform = broomFlipped ? "scaleX(-1)" : "scaleX(1)";
}

/*************************************************
 * CARD DATA
 *************************************************/

const suits = ["♠", "♥", "♦", "♣"];
const values = [
  { name: "2", value: 2 },
  { name: "3", value: 3 },
  { name: "4", value: 4 },
  { name: "5", value: 5 },
  { name: "6", value: 6 },
  { name: "7", value: 7 },
  { name: "8", value: 8 },
  { name: "9", value: 9 },
  { name: "10", value: 10 },
  { name: "J", value: 10 },
  { name: "Q", value: 10 },
  { name: "K", value: 10 },
  { name: "A", value: 11 },
];

function createDeck() {
  let deck = [];
  for (let suit of suits) {
    for (let c of values) {
      deck.push({ ...c, suit });
    }
  }
  return deck;
}

function drawCard(deck) {
  return deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
}

// Render hand to screen, optionally clickable (for poker)
function renderHand(hand, id, clickable = false) {
  const container = document.getElementById(id);
  container.innerHTML = "";
  hand.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = `${c.name}${c.suit}`;
    if (clickable) {
      div.onclick = () => {
        div.classList.toggle("selected");
        c.selected = !c.selected;
      };
    }
    container.appendChild(div);
  });
}

/*************************************************
 * BLACKJACK
 *************************************************/

function goToBlackjack() {
  if (money <= 0) {
    alert("You're broke. Clean the floors.");
    return;
  }
  showScreen("blackjack-screen");
  updateMoneyDisplay();
}

// Calculate blackjack score
function blackjackScore(hand) {
  let total = 0,
    aces = 0;
  hand.forEach((c) => {
    total += c.value;
    if (c.name === "A") aces++;
  });
  while (total > 21 && aces--) total -= 10;
  return total;
}

// Update scores on screen
function updateScores() {
  document.getElementById("player-score").textContent =
    blackjackScore(bjPlayer);
  document.getElementById("dealer-score").textContent =
    blackjackScore(bjDealer);
}

function startBlackjack() {
  bjBet = parseFloat(document.getElementById("bet-input").value);
  if (isNaN(bjBet) || bjBet <= 0) {
    alert("Enter a valid bet.");
    return;
  }
  if (bjBet > money) {
    alert("You don't have enough money.");
    return;
  }

  money -= bjBet;
  updateMoneyDisplay();

  bjDeck = createDeck();
  bjPlayer = [drawCard(bjDeck), drawCard(bjDeck)];
  bjDealer = [drawCard(bjDeck), drawCard(bjDeck)];
  bjOver = false;

  renderHand(bjPlayer, "player-hand");
  renderHand(bjDealer, "dealer-hand");

  updateScores();
  document.getElementById("result").textContent = "";

  document.getElementById("bj-deal").disabled = true;
}

function hit() {
  if (bjOver) return;
  bjPlayer.push(drawCard(bjDeck));
  renderHand(bjPlayer, "player-hand");
  updateScores();
  if (blackjackScore(bjPlayer) > 21) endBlackjack("Bust! Dealer wins.");
}

function stand() {
  if (bjOver) return;
  while (blackjackScore(bjDealer) < 17) {
    bjDealer.push(drawCard(bjDeck));
  }
  renderHand(bjDealer, "dealer-hand");
  updateScores();

  const p = blackjackScore(bjPlayer);
  const d = blackjackScore(bjDealer);

  if (d > 21 || p > d) endBlackjack("You win!", 2);
  else if (p < d) endBlackjack("Dealer wins.");
  else endBlackjack("Push.", 1);
}

function endBlackjack(msg, mult = 0) {
  bjOver = true;
  if (mult) money += bjBet * mult;
  updateMoneyDisplay();
  document.getElementById("result").textContent = msg;
  document.getElementById("bj-deal").disabled = false;
}

/*************************************************
 * POKER (5-CARD DRAW)
 *************************************************/

function goToPoker() {
  if (money <= 0) {
    alert("You're broke. Clean the floors.");
    return;
  }
  showScreen("poker-screen");
  updateMoneyDisplay();
}

// Hand rankings helper
function evaluatePokerHand(hand) {
  let counts = {},
    suitsCount = {};
  let valuesNum = hand.map((c) =>
    c.name === "A"
      ? 14
      : c.name === "K"
      ? 13
      : c.name === "Q"
      ? 12
      : c.name === "J"
      ? 11
      : parseInt(c.name)
  );
  hand.forEach((c) => {
    counts[c.name] = (counts[c.name] || 0) + 1;
    suitsCount[c.suit] = (suitsCount[c.suit] || 0) + 1;
  });
  valuesNum.sort((a, b) => b - a);

  const isFlush = Object.values(suitsCount).some((v) => v === 5);
  const isStraight = valuesNum.every(
    (v, i, arr) => i === 0 || arr[i - 1] - v === 1
  );

  const countValues = Object.values(counts).sort((a, b) => b - a);
  let rank = 0;
  if (isFlush && isStraight) rank = 8; // straight flush
  else if (countValues[0] === 4) rank = 7; // four
  else if (countValues[0] === 3 && countValues[1] === 2) rank = 6; // full house
  else if (isFlush) rank = 5;
  else if (isStraight) rank = 4;
  else if (countValues[0] === 3) rank = 3;
  else if (countValues[0] === 2 && countValues[1] === 2) rank = 2; // two pair
  else if (countValues[0] === 2) rank = 1;
  else rank = 0; // high card
  return rank;
}

// Start Poker
function startPoker() {
  pkBet = parseFloat(document.getElementById("poker-bet").value);
  if (isNaN(pkBet) || pkBet <= 0) {
    alert("Enter valid bet.");
    return;
  }
  if (pkBet > money) {
    alert("You don't have enough money.");
    return;
  }

  money -= pkBet;
  updateMoneyDisplay();

  pkDeck = createDeck();
  pkPlayer = [];
  pkDealer = [];
  for (let i = 0; i < 5; i++) {
    pkPlayer.push(drawCard(pkDeck));
    pkDealer.push(drawCard(pkDeck));
  }

  pkActive = true;
  renderHand(pkPlayer, "poker-player-hand", true);
  renderHand(pkDealer, "poker-dealer-hand", false);

  document.getElementById("player-hand-rank").textContent = "";
  document.getElementById("dealer-hand-rank").textContent = "";
  document.getElementById("poker-result").textContent = "";

  document.getElementById("pk-deal").disabled = true;
}

// Draw replacements for selected cards
function drawPokerCards() {
  if (!pkActive) return;
  for (let i = 0; i < pkPlayer.length; i++) {
    if (pkPlayer[i].selected) {
      pkPlayer[i] = drawCard(pkDeck);
    }
  }

  renderHand(pkPlayer, "poker-player-hand", true);

  // Simple dealer AI: replace random 0-3 cards
  for (let i = 0; i < pkDealer.length; i++) {
    if (Math.random() < 0.4) pkDealer[i] = drawCard(pkDeck);
  }
  renderHand(pkDealer, "poker-dealer-hand");

  // Evaluate hands
  const pRank = evaluatePokerHand(pkPlayer);
  const dRank = evaluatePokerHand(pkDealer);

  const rankNames = [
    "High Card",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
  ];
  document.getElementById("player-hand-rank").textContent = rankNames[pRank];
  document.getElementById("dealer-hand-rank").textContent = rankNames[dRank];

  if (pRank > dRank) {
    money += pkBet * 2;
    document.getElementById("poker-result").textContent = "You win!";
  } else if (pRank < dRank) {
    document.getElementById("poker-result").textContent = "Dealer wins.";
  } else {
    money += pkBet;
    document.getElementById("poker-result").textContent = "Tie.";
  }

  updateMoneyDisplay();
  pkActive = false;
  document.getElementById("pk-deal").disabled = false;
}
