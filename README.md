# 🧭 Spectrum Sync

A TV-hosted, phone-controlled **cooperative spectrum guessing game** where one player (the **Navigator**) places a slider on a left↔right scale, guided by short hints from everyone else (the **Cluers**). Cluers know the **exact target** position; the Navigator does not.

*3–12 players • ages 9+ • 12–20 minutes*

---

## ✨ What’s New vs. “Odd Ball Out”

* No impostors, no bluffing.
* **Cluers see the exact target (0–100)** and submit short hints.
* **Duplicate hints auto-cancel** to prevent obvious spam.
* **Anonymous approval voting** among Cluers picks which hint(s) the Navigator will see.

  * **All hints tied for top votes are shown** (there is no max cap).
* Navigator makes the final placement. Everyone scores based on proximity.

---

## 🧠 Game Overview

* **Goal:** As a team, land as close as possible to the hidden target point on a spectrum (e.g., **Spicy ↔ Mild**, **Ancient ↔ Futuristic**).
* **Devices:** One TV/host screen + each player’s phone/tablet.
* **Inputs:** Text/emoji hints, approval voting, and a slider for the Navigator.

### Player Roles

* **Navigator (1):** Sees only the spectrum and the Final Clue(s). Places the slider.
* **Cluers (everyone else):** See the spectrum **and** the **exact target value** (0–100). Submit hints, then vote on which hints should be revealed.

---

## 🎮 How to Play

### 1) Host Setup (TV)

* Open the game on a TV/large screen.
* Click **“Host Game on TV”**.
* Share the **QR code** / **room code**.

### 2) Players Join (Phones)

* Scan QR or enter the URL + room code.
* Choose a name and avatar.
* Ready up.

### 3) Round Flow

Each round follows these phases:

1. **Spectrum Reveal (TV, 3s)**

   * Show spectrum labels (e.g., “Spicy ↔ Mild”).
   * System secretly picks **target ∈ [0…100]**.

2. **Navigator Assigned (auto)**

   * Rotates each round.
   * Navigator **does not** submit a hint this round.

3. **Hint Phase (Phones, 35s default)**

   * Cluers see **Target = N** (exact number).
   * Submit **one** concise hint (text or emoji).
   * **Duplicate cancellation:** exact normalized duplicates are removed; affected authors may **resubmit once** within the timer.
   * Per-spectrum **banned words** block trivial anchors (e.g., on Hot↔Cold: “hot”, “cold”, “freezing”, “boiling”).

4. **Clue Voting (Phones, 10s) — Cluers only**

   * All **surviving** hints appear **anonymously** (no author names).
   * **No self-vote** (your hint is disabled).
   * **Approval voting**: up to **2** hints per voter.
   * **Final Clues = all hints tied for top votes.**

     * If a single hint wins outright → only that one is shown.
     * If multiple hints tie for first → **show them all** to the Navigator (no max cap).

5. **Placement (Navigator, 20s)**

   * TV shows the **Final Clue(s)**.
   * Navigator moves the slider to the estimated target and **locks in**.
   * (No audience/player nudges in this ruleset.)

6. **Reveal & Scoring (TV, 8s)**

   * Show the **true target**, the **guess**, and **distance**.
   * Award points (see below).
   * Reveal Final Clue authors (after scoring).

7. **Next Round (TV, 5s)**

   * Rotate Navigator, draw next spectrum.

**Game End:** First to **15 points** or after **6 rounds** (configurable).

---

## 🏆 Scoring

Let **d = |guess − target|** on a 0–100 scale.

### Team Proximity (everyone)

* **Bullseye:** d ≤ **3** → **+3**
* **Close:** 4–10 → **+2**
* **Decent:** 11–24 → **+1**
* **Off:** d ≥ 25 → **+0**

### Navigator Bonus

* If **Close** → **+1**
* If **Bullseye** → **+2** (replaces +1)

### Assist (authors of Final Clues only)

* If team result **Decent or better** (d ≤ 24): **+1**
* If **Bullseye**: **+2** (instead of +1)

> *Assist only pays if the team actually performed, deterring popularity votes on weak hints.*

### Voter Insight (Cluers who voted)

* If you approved at least one Final Clue **and** the team result is **Close or Bullseye**: **+1**

> *Encourages honest voting for useful clues; modest value to avoid vote-gaming.*

**Removed:** originality/MVP likes from older drafts (reduces point inflation and bias).

---

## 🧩 Examples

* **Target 68, Guess 70 (d=2, Bullseye):**

  * Team: +3 each
  * Navigator: +2
  * Each Final Clue author: +2
  * Voter Insight (for voters who approved any Final Clue): +1

* **Target 42, Guess 55 (d=13, Decent), two Final Clues tied:**

  * Team: +1 each
  * Navigator: +0
  * Each Final Clue author: +1
  * Voter Insight: none (needs Close/Bullseye)

---

## 🛡️ Anti-Solving Levers

* **Duplicate cancellation:** identical hints (after normalization) are removed.
* **Banned words:** prevent “label parroting” of spectrum ends.
* **Anonymous, no-self approval voting:** reduces popularity bias.
* **Assist conditioned on team result:** rewards usefulness, not clout.

**Normalization pipeline:** lowercase → trim/collapse spaces → remove punctuation → collapse repeated emoji → strip diacritics. (Optional near-duplicate mode can be added later.)

---

## 🧭 Host Controls (TV)

* **Start / Skip spectrum**
* **Add time** (+10s to current phase)
* **Moderate hint** (delete/uncancel; reason to author)
* **Toggle Kids Mode**
* **Duplicate sensitivity** (“exact” vs. “exact+near”)
* **End game** → winners screen

---

## 👶 Kids Mode

* +5s to Hint and +5s to Placement.
* Simpler spectrums (see packs below).
* Keep same scoring (they already see the exact target).

---

## 📦 Spectrum Packs (content)

Each spectrum item:

```json
{
  "id": "spicy_mild_01",
  "left": "Spicy",
  "right": "Mild",
  "banned": ["spicy","mild","hot","cold","heat","spice"],
  "pack": "default"
}
```

**Default Pack (examples):**

* Ancient ↔ Futuristic
* Quiet ↔ Loud
* Niche ↔ Mainstream
* Plain ↔ Fancy
* Light ↔ Heavy (meal)
* Silly ↔ Serious
* Homemade ↔ Store-Bought

**Family/Kids Pack (examples):**

* Big ↔ Small
* Fast ↔ Slow
* Sweet ↔ Sour
* Day Vibes ↔ Night Vibes
* Scary ↔ Safe
* Messy ↔ Neat

**Party/Streamer Pack (examples):**

* Meme Graveyard ↔ Fresh Meme
* Introvert Energy ↔ Extrovert Energy
* Cozy Night In ↔ Out-Out

---

## 🛠️ Project Structure

```
spectrum-sync/
├── server/                 # Node.js WebSocket server
│   ├── index.js            # Main server logic
│   └── spectrumPacks.js    # Spectrum sets (replaces questionPacks)
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx            # Landing / Join
│   │   │   ├── TVDisplay.jsx       # TV host view (spectrums, results)
│   │   │   └── PhoneController.jsx  # Player phone view (hint, vote)
│   │   └── hooks/
│   │       └── useWebSocket.js     # WebSocket hook
│   └── public/
└── package.json
```

---

## 🧩 Technology Stack

**Server**

* Express.js (HTTP)
* ws (WebSocket)
* bad-words (profanity filter)
* qrcode (QR generation)
* uuid (IDs)

**Client**

* React + Vite
* qrcode.react
* WebSocket API

---

## ⚙️ Configuration

**Server (`server/index.js`):**

```js
// Game config (tweakable)
const WIN_SCORE = 15;
const MAX_ROUNDS = 6;
const PHASE_SECONDS = {
  HINT: 35,
  VOTE: 10,
  PLACE: 20,
  REVEAL: 8,
  BUFFER: 5
};
const DUPLICATE_MODE = "exact"; // "exact" | "near"
const KIDS_MODE = false;
```

**Client (`client/.env`):**

```
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
```

---

## 🔌 WebSocket Events

**Server → Clients**

* `ROOM_STATE` → lobby/players/config
* `ROUND_START` → `{ round, spectrum:{id,left,right}, navigatorId, targetKnownToCluers:true, phase:"HINT" }`
* `HINT_STATUS` → `{ accepted:[{id,text}], canceled:[{id,text}] }`
* `VOTE_START` → `{ hints:[{id,text}], maxVotes:2, selfVoteDisabled:true }`
* `VOTE_RESULT` → `{ finalClueIds:[...], tieBreak: null | "distinctness" }`
* `PLACE_START` → `{ finalClues:[{id,text}], phase:"PLACE" }`
* `REVEAL` → `{ target, guess, distance, points:{ perPlayer:{id:delta} } }`
* `SCORE_UPDATE` → `{ leaderboard:[{id,name,score}], nextNavigatorId }`
* `ERROR` → `{ code, message }`

**Clients → Server**

* `JOIN` / `READY`
* `HINT_SUBMIT` → `{ text }`
* `HINT_RESUBMIT` → `{ text }` (once if canceled)
* `VOTE_CAST` → `{ hintIds:[...] }` (0…2, excluding self)
* `PLACEMENT_SET` → `{ value:0..100 }` (Navigator)
* `PLACEMENT_LOCK`

**Tie handling for Final Clues:**
If >1 hint ties for first, **all** those hints are shown. If an extreme multi-way tie occurs, optionally list them with reduced font to fit.

---

## 🧯 Edge Cases

* **All hints canceled / none submitted:**

  * Navigator receives a **brief (1s) soft glow** of the region ±5 around the target.
  * No Assist or Voter Insight points awarded.

* **Only one surviving hint:**

  * It auto-wins and is shown.

* **Everyone tries to self-vote:**

  * Self-vote disabled. If nobody votes, the system computes the top tier as all surviving hints with the **highest implicit score = 0** and **shows them all**.

* **Toxic or doxxing content:**

  * Profanity filter blocks; host can delete a hint or kick/mute if needed.

---

## 🧑‍💻 Running the Game

### Prerequisites

* Node.js (v18+)
* npm

### Install

```bash
git clone https://github.com/your-org/spectrum-sync.git
cd spectrum-sync
npm run install-all
# or:
cd server && npm install
cd ../client && npm install
```

### Development

```bash
npm run dev
# Server: http://localhost:3001
# Client: http://localhost:5173
```

### Build (Client)

```bash
cd client
npm run build
# Output in client/dist/
```

### Deploy

* **Server:** Deploy `server/` to any Node.js host.
* **Client:** Deploy `client/dist/` to a static host (Netlify, Vercel, etc).

---

## 🧰 Accessibility & UX

* High-contrast labels with tick marks (0, 25, 50, 75, 100).
* Slider includes numeric readout while dragging.
* Emoji-friendly inputs; large tap targets.
* “How to Play” card on phones before Round 1.

---

## 🤝 Contributing

Issues and PRs welcome!
Please keep spectrums family-friendly and avoid factual/binary axes.

---

## 📄 License

ISC License

---

## 🎉 Credits

Designed for fast, funny, cooperative couch play. Have fun!

