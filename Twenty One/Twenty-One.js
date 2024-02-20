const READLINE = require('readline-sync');

class Config {
  static WINS_NEEDED = 2;
  static HAND_VALUE_LIMIT = 21;
  static INITIAL_DRAW_COUNT = Math.floor(Config.HAND_VALUE_LIMIT / 10);
  static CPU_STAY_TARGET = Config.HAND_VALUE_LIMIT - 4;
  static NUM_HUMAN_PLAYERS = 2;
  static NUM_CPU_PLAYERS = 2;
  static thereIsOnlyOneHumanPlayer = Config.NUM_HUMAN_PLAYERS === 1
  static thereIsOnlyOneCpuPlayer = Config.NUM_CPU_PLAYERS === 1

  static NUM_PLAYERS = Config.NUM_HUMAN_PLAYERS + Config.NUM_CPU_PLAYERS;
  static CPUS_NAME_PREFIX = 'Robot';
  static HUMANS_NAME_PREFIX = 'Human';
  static PAUSE_BETWEEN_DEALS = 500 / Config.INITIAL_DRAW_COUNT;
  static GAP = '     ';

  static messages = {
    welcomeToBlackjack: `    ╦ ╦┌─┐┬  ┌─┐┌─┐┌┬┐┌─┐  ╔╦╗┌─┐
    ║║║├┤ │  │  │ ││││├┤    ║ │ │
    ╚╩╝└─┘┴─┘└─┘└─┘┴ ┴└─┘   ╩ └─┘` + '\n' +
        `      ██████  ██       █████   ██████ ██   ██      ██  █████   ██████ ██   ██ 
      ██   ██ ██      ██   ██ ██      ██  ██       ██ ██   ██ ██      ██  ██  
      ██████  ██      ███████ ██      █████        ██ ███████ ██      █████   
      ██   ██ ██      ██   ██ ██      ██  ██  ██   ██ ██   ██ ██      ██  ██  
      ██████  ███████ ██   ██  ██████ ██   ██  █████  ██   ██  ██████ ██   ██ `,
    pressAnyKey: '      (  press a character key to continue  )',
    handValueTarget: '       Hand Value Target: ' + Config.HAND_VALUE_LIMIT,
    numberOfWins: '            First to ' + Config.WINS_NEEDED + ' win(s)!',
    hitOrStay: '(h)it or (s)tay?',
    playAgain: 'Do you want to play again? (y)es or (n)o',
    noWinner: '      There was no winner :(',
    tie: '      Tie :(',
    hasWon: ' has won the round',
    wonTournament: ' HAS WON THE TOURNAMENT!!!',
    exit: 'Goodbye',
  };
}

class Tools {
  static print(message) {
    console.log(message);
  }

  static randomNumBetween(min, max) {
    if (min > max) {
      [min, max] = [max, min];
    }

    return Math.floor((Math.random() * (max - min + 1)) + min);
  }

  static pause(msToPause) {
    let currentTime = Tools.getCurrentTimeInSeconds();
    let endTime = currentTime + (msToPause / 1000);

    while (currentTime < endTime) {
      currentTime = Tools.getCurrentTimeInSeconds();
    }
  }

  static getCurrentTimeInSeconds() {
    return new Date().getTime() / 1000;
  }

  static getYesOrNo() {
    let yesOrNo = READLINE.keyIn('', {limit: 'yn'}).toLowerCase();

    return yesOrNo === 'y';
  }

  static pressAnyKeyToContinue() {
    Tools.print('\n');
    Tools.print(Config.messages.pressAnyKey);
    READLINE.keyIn();
  }
}

class Player {
  constructor(name) {
    this.name = name;
    this.score = 0;
    this.hand = [];
    this.handValue = 0;
    this.aceSubtractionTokens = 0;
  }

  hit(card) {
    this.hand.push(card);
    this.updateHandValueForLastCard();
  }

  updateHandValueForLastCard() {
    this.addLastCardsValueToHandValue();
    this.addAceSubtractionTokenForLastCard();
    this.adjustHandValueForAces();
  }

  addLastCardsValueToHandValue() {
    let lastCard = this.getLastCard();

    this.handValue += lastCard.value;
  }

  getLastCard() {
    let indexOfLastCard = this.hand.length - 1;
    return this.hand[indexOfLastCard];
  }


  addAceSubtractionTokenForLastCard() {
    let lastCard = this.getLastCard();

    if (lastCard.isAceCard()) {
      this.addAceSubtractionToken();
    }
  }

  addAceSubtractionToken() {
    this.aceSubtractionTokens++;
  }

  adjustHandValueForAces() {
    while (this.isBust() && this.aceSubtractionTokens > 0) {
      this.handValue -= 10;
      this.aceSubtractionTokens--;
    }
  }

  addOneToScore() {
    this.score += 1;
  }

  resetHand() {
    this.hand = [];
    this.handValue = 0;
    this.aceSubtractionTokens = 0;
  }

  printHand() {
    let handAndPlayerName = '';
    handAndPlayerName += this.name;

    for (let card of this.hand) {
      handAndPlayerName += Config.GAP;
      handAndPlayerName += this.getCardFace(card);
    }

    Tools.print(handAndPlayerName);
  }

  getCardFace(card) {
    return (this.handIsFull()
      && !this.lastCardIsVisible
      && this.cardIsLastInHand(card)) ? '???' : card.denomination + ' ' + card.suit;
  }

  handIsFull() {
    return Config.INITIAL_DRAW_COUNT <= this.hand.length;
  }

  isBust() {
    return this.handValue > Config.HAND_VALUE_LIMIT;
  }

  printHandValue() {
    Tools.print(this.handValue);
  }

  cardIsLastInHand(card) {
    let indexOfLastCard = this.hand.length - 1;
    let indexOfThisCard = this.hand.indexOf(card);
    return  indexOfThisCard === indexOfLastCard;
  }

  hasWonTournament() {
    return this.score >= Config.WINS_NEEDED;
  }

  handUnderValueLimit() {
    return this.handValue <= Config.HAND_VALUE_LIMIT;
  }

  resetScore() {
    this.score = 0;
  }
}

class Human extends Player {
  constructor(name) {
    super(name);
    this.lastCardIsVisible = true;
    this.type = 'human';
  }

  wantsToHit() {
    Tools.print('It is ' + this.name + '\'s turn.');
    Tools.print(Config.messages.hitOrStay);

    return READLINE.keyIn('', {limit: 'hs'}).toLowerCase() === 'h';
  }

  resetLastCardIsVisible() {
    this.lastCardIsVisible = true;
  }
}

class Cpu extends Player {
  constructor(name) {
    super(name);
    this.lastCardIsVisible = false;
    this.type = 'cpu';
  }

  wantsToHit() {
    return this.handValue < Config.CPU_STAY_TARGET;
  }

  resetLastCardIsVisible() {
    this.lastCardIsVisible = false;
  }
}

class Card {
  static SUITS = ['♠', '◆', '♣', '♥'];
  static VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  constructor(denomination, suit) {
    this.suit = suit;
    this.denomination = denomination;
    this.value = NaN;

    if (this.isAceCard()) {
      this.value = 11;
    } else if (this.isFaceCard()) {
      this.value = 10;
    } else {
      this.value = Number(this.denomination);
    }
  }

  getValue() {
    return this.value;
  }

  isFaceCard() {
    let denomination = this.denomination;
    return denomination === 'J' || denomination === 'Q' || denomination === 'K';
  }

  isAceCard() {

    return this.denomination === 'A';
  }
}

class Dealer {
  constructor() {
    this.getNewDeckAndShuffle();
  }

  getNewDeckAndShuffle() {
    this.deck = [];
    Card.SUITS.forEach(suit => {
      Card.VALUES.forEach(value => {
        this.deck.push(new Card(value, suit));
      });
    });
    this.shuffleDeckMultipleTimes(3);
  }

  shuffleDeck() {
    this.deck.sort((_, __) => {
      return Tools.randomNumBetween(-1, 1);
    });
  }

  shuffleDeckMultipleTimes(numberOfShuffles) {
    for (let shuffleNum = 0; numberOfShuffles > shuffleNum; shuffleNum++) {
      this.shuffleDeck();
    }
  }

  dealCardTo(player) {
    let topCard = this.drawCard();

    player.hit(topCard);

    this.getNewDeckIfDeckEmpty();
  }

  drawCard() {
    return this.deck.pop();
  }

  getNewDeckIfDeckEmpty() {
    if (this.deck.length < 1) {
      this.getNewDeckAndShuffle();
    }
  }
}

class Game {
  constructor() {
    this.players = [];
    this.dealer = new Dealer();
    this.roundWinner = undefined;

    this.createHumanPlayers();
    this.createCpuPlayers();
  }

  createHumanPlayers() {
    for (let playerNumber = 1;
      playerNumber <= Config.NUM_HUMAN_PLAYERS;
      playerNumber++) {
      let numberSuffix = Config.thereIsOnlyOneHumanPlayer ? '' : ' ' + playerNumber;

      this.players.push(new Human(Config.HUMANS_NAME_PREFIX + numberSuffix));
    }
  }

  createCpuPlayers() {
    for (let playerNumber = 1;
      playerNumber <= Config.NUM_CPU_PLAYERS;
      playerNumber++) {
      let numberSuffix = Config.thereIsOnlyOneCpuPlayer ? '' : ' ' + playerNumber;
      this.players.push(new Cpu(Config.CPUS_NAME_PREFIX + numberSuffix));
    }
  }

  printParameters() {
    Tools.print(Config.GAP + 'Hand Value Target: ' + Config.HAND_VALUE_LIMIT + '     '
    + 'First to ' + Config.WINS_NEEDED + ' win(s)!');
  }

  printScoreBoard() {
    let playerNamesAndScores = this.getPlayerNamesAndScores();

    let printableScoreBoard = playerNamesAndScores.join(Config.GAP);
    let line = Config.GAP + '-'.repeat(printableScoreBoard.length);

    Tools.print(line);
    Tools.print(Config.GAP + printableScoreBoard);
    Tools.print(line);
  }

  getPlayerNamesAndScores() {
    let playerNamesAndScores = [];

    for (let player of this.players) {
      playerNamesAndScores.push(player.name + ': ' + player.score);
    }

    return playerNamesAndScores;
  }

  startTwentyOne() {
    this.printWelcome();
    while (!this.isTournamentWinner()) {
      this.playOneRound();
      this.setRoundWinner();
      this.roundWinner?.addOneToScore();
      this.printRoundWinner();
      this.resetRoundWinner();
      this.resetHands();
    }

    this.printTournamentWinner();
    this.playAgain();
    this.printExit();
  }

  playOneRound() {
    this.dealInitialCards();
    for (let player of this.players) {
      this.takeATurn(player);
    }
  }

  takeATurn(player) {
    player.lastCardIsVisible = true;
    while (true) {
      if (player.isBust()) {
        this.bustOutPlayerScore(player);
        break;
      }

      if (player.wantsToHit()) {
        this.reprintTableTop();
        Tools.pause(500);
        this.dealer.dealCardTo(player);
        this.reprintTableTop();
        Tools.pause(500);
      } else {
        this.reprintTableTop();
        Tools.pause(800);
        break;
      }
    }
  }

  bustOutPlayerScore(player) {
    Tools.pause(300);
    player.handValue = 'BUST';
    this.reprintTableTop();
    Tools.pause(1000);
  }

  printRoundWinner() {
    this.reprintTableTop();
    Tools.print('\n');
    switch (this.roundWinner) {
      case undefined:
        Tools.print(Config.messages.noWinner);
        break;
      case 'tie':
        Tools.print(Config.messages.tie);
        break;
      default:
        Tools.print(this.roundWinner.name + Config.messages.hasWon);
        break;
    }

    Tools.pressAnyKeyToContinue();
  }

  resetHands() {
    this.players.forEach(player => {
      player.resetHand();
      player.resetLastCardIsVisible();
    });
  }

  resetRoundWinner() {
    this.roundWinner = undefined;
  }

  setRoundWinner() {
    let highestHandValue = -Infinity;

    this.players.forEach(player => {
      let handValue = player.handValue;

      if (player.handUnderValueLimit()) {
        if (handValue > highestHandValue) {
          this.roundWinner = player;
          highestHandValue = handValue;
        } else if (handValue === highestHandValue) {
          this.roundWinner = undefined;
        }
      }
    });
  }

  printTournamentWinner() {
    console.clear();
    this.printParameters();
    this.printScoreBoard();
    Tools.print('\n' + this.getTournamentWinner() + Config.messages.wonTournament);
  }

  getTournamentWinner() {
    for (let player of this.players) {
      if (player.score === Config.WINS_NEEDED && player.score > 0) {
        return player.name;
      }
    }
    return 'NOBODY';
  }

  playAgain() {
    Tools.print(Config.messages.playAgain);
    if (Tools.getYesOrNo()) {
      this.resetPlayerScores();
      this.startTwentyOne();
    }
  }

  resetPlayerScores() {
    this.players.forEach(player => {
      player.resetScore();
    });
  }

  dealInitialCards() {
    this.printShuffling();
    for (let dealt = 0; dealt < Config.INITIAL_DRAW_COUNT; dealt++) {
      for (let player of this.players) {
        this.dealCardTo(player);
      }
    }
  }

  dealCardTo(player) {
    this.dealer.dealCardTo(player);
    this.reprintTableTop();
    Tools.pause(Config.PAUSE_BETWEEN_DEALS);
  }

  isTournamentWinner() {
    return this.players.some(player => {
      return player.hasWonTournament();
    });
  }

  printWelcome() {
    console.clear();
    Tools.print(Config.messages.welcomeToBlackjack);
    Tools.print('\n' + Config.messages.handValueTarget + Config.messages.numberOfWins);
    Tools.pressAnyKeyToContinue();
  }

  printHands() {
    this.printCpuHands();
    this.printHumanHands();
  }

  printCpuHands() {
    for (let player of this.players) {
      if (player.type === 'cpu') {
        this.printHand(player);
      }
    }
  }

  printHumanHands() {
    for (let player of this.players) {
      if (player.type === 'human') {
        this.printHand(player);
      }
    }
  }

  printHand(player) {
    Tools.print('');
    player.printHand();
    this.printHandValueIfLastCardIsVisible(player);
    Tools.print('');
    this.printDividerIfCpuPlayer(player);
  }

  printDividerIfCpuPlayer(player) {
    if (player.type !== 'human') {
      Tools.print('--------------------------------');
    }
  }

  printShuffling() {
    console.clear();
    this.printParameters();
    this.printScoreBoard();
    Tools.print('\n\n\n            shuffling.');
    Tools.pause(400);
    console.clear();
    this.printParameters();
    this.printScoreBoard();
    Tools.print('\n\n\n            shuffling..');
    Tools.pause(400);
    console.clear();
    this.printParameters();
    this.printScoreBoard();
    Tools.print('\n\n\n            shuffling...');
    Tools.pause(400);
  }

  reprintTableTop() {
    console.clear();
    this.printParameters();
    this.printScoreBoard();
    this.printHands();
  }

  printHandValueIfLastCardIsVisible(player) {
    if (player.lastCardIsVisible === true) {
      player.printHandValue();
    } else {
      Tools.print('');
    }
  }

  printExit() {
    console.clear();
    Tools.print(Config.messages.exit);
  }
}

let game = new Game();
game.startTwentyOne();