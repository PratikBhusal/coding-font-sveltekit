import confetti from 'canvas-confetti';

export function createConfetti(size = 'big', position = { x: 0.5, y: 0.5 }) {
  const options = {
    particleCount: 400,
    spread: 200,
    origin: {
      x: position.x,
      y: position.y
    }
  };

  if (size === 'small') {
    options.particleCount = 30;
    options.spread = 200;
    options.startVelocity = 20;
  }

  confetti.create(document.getElementById('canvas'), {
    resize: true,
    useWorker: true
  })(options);
}

export function createGame(initialPlayers) {
  const players = [...initialPlayers];

  function getPreviousPowerOfTwo(value) {
    return 2 ** Math.floor(Math.log2(value));
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  shuffleArray(players);

  const tournament = {
    rounds: [],
    currentRound: -1,
    finalRound: null,
    pendingByes: [],

    startGame: function () {
      const nextMatchup = this.getNextMatchup();
      if (!nextMatchup) {
        this.createNextRound();
        return this.getNextMatchup();
      }
      return nextMatchup;
    },

    setWinner: function (selectedPlayer) {
      const matchup = this.getNextMatchup();
      if (
        matchup &&
        matchup.players.find(
          (player) => player.family === selectedPlayer.family
        )
      ) {
        matchup.winner = selectedPlayer;

        const nextMatchup = this.startGame();
        if (nextMatchup) {
          return nextMatchup;
        }

        this.finalRound = this.currentRound;
        return {
          winner: matchup.players.find(
            (player) => player.family === selectedPlayer.family
          )
        };
      } else {
        console.error('Invalid winner or no available matchup.');
      }
    },

    createNextRound: function () {
      this.currentRound++;
      let winners;

      if (this.rounds.length > 0) {
        winners = this.rounds[this.currentRound - 1]
          .filter((matchup) => matchup.winner)
          .map((matchup) => ({
            player: matchup.winner,
            sourceSlot: matchup.winnerSlot
          }))
          .concat(this.pendingByes);
        this.pendingByes = [];
      } else {
        const fullRoundSize = getPreviousPowerOfTwo(players.length);
        const playInMatchCount = players.length - fullRoundSize;
        const playInPlayerCount = playInMatchCount * 2;

        // sourceSlot tracks the post-play-in bracket slot for SVG layout.
        // Play-in opponents share a slot because only the winner enters it.
        winners =
          playInMatchCount > 0
            ? players.slice(0, playInPlayerCount).map((player, index) => ({
                player,
                sourceSlot: Math.floor(index / 2)
              }))
            : players.map((player, index) => ({
                player,
                sourceSlot: index
              }));
        this.pendingByes =
          playInMatchCount > 0
            ? players.slice(playInPlayerCount).map((player, index) => ({
                player,
                sourceSlot: playInMatchCount + index
              }))
            : [];
      }

      for (let i = 0; i < winners.length; i += 2) {
        this.rounds[this.currentRound] = this.rounds[this.currentRound] || [];
        const matchupIndex = this.rounds[this.currentRound].length;
        const entrants = winners.slice(i, i + 2);
        const players = entrants.map((entrant) => entrant.player);
        const sourceSlots = entrants.map((entrant) => entrant.sourceSlot);
        if (players.length === 1) {
          this.rounds[this.currentRound].push({
            players,
            sourceSlots,
            winner: players[0],
            winnerSlot: matchupIndex
          });
        } else {
          this.rounds[this.currentRound].push({
            players,
            sourceSlots,
            winner: null,
            winnerSlot: matchupIndex
          });
        }
      }
    },

    getNextMatchup: function () {
      const currentRoundMatches = this.rounds[this.currentRound];
      return (
        currentRoundMatches &&
        currentRoundMatches.find((match) => !match.winner)
      );
    }
  };

  return tournament;
}
