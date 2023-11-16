const readline = require('readline-sync');
const YELLOW = '\x1b[93m';
const WHITE = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[91m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const INPUT_PROMPT = '->>  ';

class Rule {
  constructor(keyStrokeInput, winsAgainst) {
    this.keyStrokeInput = keyStrokeInput;
    this.winsAgainst = winsAgainst;
  }

  addWinsAgainst(...losers) {
    losers.forEach(loser => {
      this.winsAgainst.push(loser);
    });
  }
}

class RoundResult {
  constructor(winner, player1, player2) {
    this.winner = winner;
    this.player1 = [player1.id, player1.move];
    this.player2 = [player2.id, player2.move];
  }

  printRoundResult() {
    let player1id = this.player1[0];
    let player1Move = this.player1[1];
    let player2id = this.player2[0];
    let player2Move = this.player2[1];
    let winner = this.winner;
    let resultsSentence = player1id + ' played ' + player1Move + '. ' +
                          player2id + ' played ' + player2Move + '.';

    if (winner === null || player1Move === null || player2Move === null) {
      print( resultsSentence + '\nerror');
    } else if (winner === 'tie') {
      print(resultsSentence + "\nIt's a tie!");
    } else {
      print(resultsSentence + '\n' + this.winner + ' wins!!' + '\n');
    }
  }
}

class Referee {
  constructor() {
    this.rules = {
      rock: new Rule('r', ['scissors']),
      paper: new Rule('p', ['rock']),
      scissors: new Rule('s', ['paper']),
    };
  }

  getRules(withInputsToo = false) {
    let printInputOption = function(inputOption) {
      if (withInputsToo === true) {
        return '(' + YELLOW + inputOption + WHITE + ') ';
      } else {
        return '';
      }
    };

    let rules = '';

    Object.keys(this.rules).forEach(move => {
      let inputOption = this.rules[move].keyStrokeInput;

      rules += printInputOption(inputOption) + move.toUpperCase() + '  wins against...  ' +
        this.rules[move].winsAgainst.join(', ') + '\n';
    });

    return rules;
  }

  getRoundResult(player1, player2) {
    let winner = null;

    if (
      player1.move === player2.move ||
      (!this.rules[player1.move].winsAgainst.includes(player2.move)
      && !this.rules[player2.move].winsAgainst.includes(player1.move))
    ) {
      winner = 'tie';
    } else if (this.rules[player1.move].winsAgainst.includes(player2.move)) {
      winner = player1.id;
    } else {
      winner = player2.id;
    }

    return new RoundResult(winner, player1, player2);
  }

  setLizardSpock() {
    let wantsLizardSpock = readline.keyIn('\nWould you like to add Lizard/Spock rules? \n(' +
    YELLOW + 'y/n' + WHITE + ')\n' + INPUT_PROMPT, {limit: 'yn'});

    if (wantsLizardSpock === 'y') {
      this.rules.spock = new Rule('o', ['rock', 'scissors']);
      this.rules.lizard = new Rule('l', ['paper', 'spock']);
      this.rules.rock.addWinsAgainst('lizard');
      this.rules.scissors.addWinsAgainst('lizard');
      this.rules.paper.addWinsAgainst('spock');
    }

    console.clear();
  }
}

class UserPlayer {
  constructor(id = 'user') {
    this.id = id;
    this.move = null;
  }

  pickMove(referee) {
    console.clear();
    let options = Object.keys(referee.rules);
    print(this.id + ', please select a move:\n' + referee.getRules(true));

    let viableInputs = options.map(option => {
      let abbreviation = referee.rules[option].keyStrokeInput;

      return abbreviation;
    });

    let letterChoice = readline.keyIn('', {limit: viableInputs}).toLowerCase();
    let move = options[viableInputs.indexOf(letterChoice)];

    this.move = move;
    console.clear();
  }

  resetMove() {
    this.move = null;
  }
}

class CPUPlayer {
  constructor(id) {
    this.id = id;
    this.move = null;
  }

  pickMove(referee, moveHistory) {
    let lastMoveIndex = moveHistory[this.id].length - 1;

    let enemyID = this.getEnemyPlayerID(...Object.keys(moveHistory));
    let enemyLastMove = moveHistory[enemyID][lastMoveIndex];

    let myLastMove = moveHistory[this.id][lastMoveIndex];
    let mySecondLastMove = moveHistory[this.id][lastMoveIndex - 1];

    let enemyWonLastMove = this.wasWinningMove(enemyLastMove);
    let enemyLostLastTwoMoves = this.wasWinningMove(myLastMove) &&
    this.wasWinningMove(mySecondLastMove);

    this.printCPUisPickingAMove(this.id);

    if (enemyWonLastMove) {
      this.move = this.getMoveThatBeats(enemyLastMove, referee.rules);
    } else if (enemyLostLastTwoMoves) {
      let moveThatBeatsMyLastMove =
        this.getMoveThatBeats(myLastMove, referee.rules);
      this.move = this.getMoveThatBeats(moveThatBeatsMyLastMove, referee.rules);
    } else {
      this.move = getRandomKey(referee.rules);
    }
  }

  wasWinningMove(string) {
    if (string === undefined) {
      return false;
    }
    return string.startsWith(GREEN);
  }

  getMoveThatBeats(moveWithColourTags, rules) {
    let possibleMoves = Object.keys(rules);
    let move = this.removeColourTags(moveWithColourTags, possibleMoves);
    let movesThatWouldWin = [];

    possibleMoves.forEach(possibleMove => {
      if (rules[possibleMove].winsAgainst.includes(move)) {
        movesThatWouldWin.push(possibleMove);
      }
    });

    return movesThatWouldWin[randomNumBetween(0, movesThatWouldWin.length - 1)];
  }

  removeColourTags(string, possibleMoves) {
    for (let index = 0; index < possibleMoves.length; index++) {
      let move = possibleMoves[index];
      if (string.includes(move)) {
        return move;
      }
    }
    return string;
  }

  getEnemyPlayerID(...theIDs) {
    let enemyID;
    theIDs.forEach(name => {
      if (name !== this.id) {
        enemyID = name;
      }
    });
    return enemyID;
  }

  printCPUisPickingAMove(id) {
    let printCPUisPickingAMoveOnce = function(id, additionalString = '') {
      console.clear();
      print(id + ' is picking a move' + additionalString);
      wait(220);
    };

    printCPUisPickingAMoveOnce(id);
    printCPUisPickingAMoveOnce(id, '.');
    printCPUisPickingAMoveOnce(id, '..');
    printCPUisPickingAMoveOnce(id, '...');
    printCPUisPickingAMoveOnce(id, '....');
    console.clear();
  }

  resetMove() {
    this.move = null;
  }
}


class MoveHistory {
  constructor(player1id, player2id) {
    this[player1id] = [];
    this[player2id] = [];
  }

  updateMoveHistory(roundResult) {
    let player1id = roundResult.player1[0];
    let player1Move = roundResult.player1[1];
    let player2id = roundResult.player2[0];
    let player2Move = roundResult.player2[1];
    let winner = roundResult.winner;

    if (winner === player1id) {
      player1Move = GREEN + player1Move + WHITE;
    } else {
      player1Move = RED + player1Move + WHITE;
    }

    if (winner === player2id) {
      player2Move = GREEN + player2Move + WHITE;
    } else {
      player2Move = RED + player2Move + WHITE;
    }

    this[player1id].push(player1Move);
    this[player2id].push(player2Move);
  }

  printMoveHistory() {
    let playerMoves = Object.entries(this);
    let player1Moves = playerMoves[0][1].slice().reverse();
    let player2Moves = playerMoves[1][1].slice().reverse();
    let player1ID = playerMoves[0][0];
    let player2ID = playerMoves[1][0];
    let vs = ' vs ';
    let lineLength = lengthOfLongestString(...playerMoves[0][1],
      playerMoves[0][0], player1ID, player2ID);
    let moveHistoryString = '\nHISTORY\n' + player1ID.padEnd(lineLength) +
      makeSpaces(vs.length) + player2ID + '\n';

    for (let moveIndex = 0; moveIndex < player1Moves.length; moveIndex++) {
      moveHistoryString += player1Moves[moveIndex].padEnd(lineLength) +
      vs + player2Moves[moveIndex] + '\n';
    }

    print(moveHistoryString);
  }
}

class ScoreKeeper {
  constructor(player1id, player2id) {
    this.moveHistory = new MoveHistory(player1id, player2id);
    this.winLimit = 1;
    this.score = {
      [player1id]: 0,
      [player2id]: 0,
    };
  }

  setTournamentGameLimit() {
    this.winLimit = Number(readline.keyIn('How many wins would you like to play to? \n(' +
    YELLOW + '1-9' + WHITE + ' or ' + YELLOW + 'u' + WHITE + 'nlimited)\n' +
    INPUT_PROMPT, {limit: '123456789u'}));
    console.clear();
  }

  updateScore(roundResult) {
    let winner = roundResult.winner;

    if (winner !== roundResult.player1[0] &&
        winner !== roundResult.player2[0]) {
      return;
    }

    this.score[winner] += 1;
  }

  printScore() {
    let scores = Object.entries(this.score);
    let player1Id = scores[0][0];
    let player1Score = scores[0][1];
    let player2Id = scores[1][0];
    let player2Score = scores[1][1];
    let padding = makeSpaces(3);
    let winLimit = this.winLimit;
    if (Number.isNaN(winLimit)) {
      winLimit = 'Endless';
    }

    print(`\nSCORE\n${player1Id} ${player1Score + padding + player2Id} ${player2Score}` +
      padding + '\nWIN LIMIT: ' + winLimit);
  }

  printTournamentWinner() {
    let indexOfWinner = Object.values(this.score).indexOf(
      returnLargest(Object.values(this.score))
    );
    let winner = Object.keys(this.score)[indexOfWinner];
    print(winner + ' wins the tournament!');
  }

  tournamentIsWon() {
    let tournamentIsWon =
      returnLargest(Object.values(this.score)) >= this.winLimit;
    if (tournamentIsWon) {
      this.printTournamentWinner();
      return true;
    } else {
      return false;
    }
  }
}

class RPSGame {
  constructor() {
    this.referee = new Referee();
  }

  printWelcome() {
    console.clear();
    print('Welcome to Rock Paper Scissors');
    pressAnyKeyToContinue();
    console.clear();
  }

  getPlayerType() {
    let playerDesignation = BLUE + 'player 1' + WHITE;
    let player1Exists = Boolean(this.player1);

    if (player1Exists) {
      playerDesignation = MAGENTA + 'player 2' + WHITE;
    }

    let playerQuestion = 'What kind of player is ' + playerDesignation + '? \n( ' + YELLOW +
      'h' + WHITE + 'uman or ' + YELLOW + 'c' + WHITE + 'pu )\n' + INPUT_PROMPT;
    let cpuOrHuman = readline.keyIn(playerQuestion, {limit: 'hc'}).toLowerCase();

    let playerType = '';
    if (cpuOrHuman === 'h') {
      playerType = 'human';
    } else {
      playerType = 'cpu';
    }

    console.clear();
    print(playerQuestion + playerType);
    return playerType;
  }

  makeAPlayer(playerType) {
    let player1Exists = Boolean(this.player1);

    let playerColour = BLUE;

    if (player1Exists) {
      playerColour = MAGENTA;
    }

    let playerName = '';

    while (playerName.trim() === '') {
      playerName = readline.question('What is their name?\n' + INPUT_PROMPT );
    }

    playerName = playerColour + playerName + WHITE;

    console.clear();

    if (playerType === 'human') {
      return new UserPlayer(playerName);
    }

    let cpuPlayer = new CPUPlayer(playerName);
    return cpuPlayer;
  }

  playAgain() {
    let wantsToPlayAgain = readline.keyIn('\nWould you like to play another tournament? \n(' +
    YELLOW + 'y/n' + WHITE + ')\n' + INPUT_PROMPT, {limit: 'yn'});
    console.clear();

    if (wantsToPlayAgain === 'y') {
      this.referee = new Referee();
      this.initScoreAndRules();

      return true;
    } else {
      return false;
    }
  }

  initPlayers() {
    console.clear();
    this.player1 = this.makeAPlayer(this.getPlayerType(), this.referee);
    this.player2 = this.makeAPlayer(this.getPlayerType(), this.referee);
  }

  initScoreAndRules() {
    this.scoreKeeper = new ScoreKeeper(this.player1.id, this.player2.id);
    this.scoreKeeper.setTournamentGameLimit();
    print(this.referee.getRules());
    this.referee.setLizardSpock();
  }

  playRPS() {
    this.printWelcome();
    this.initPlayers();
    this.initScoreAndRules();

    do {
      operateMethodsOn([this.player1, this.player2], ['pickMove', this.referee,
        this.scoreKeeper.moveHistory]);

      let roundResult = this.referee.getRoundResult(this.player1, this.player2);
      this.scoreKeeper.updateScore(roundResult);
      this.scoreKeeper.moveHistory.updateMoveHistory(roundResult);

      wait(600);
      roundResult.printRoundResult();
      this.scoreKeeper.printScore();
      this.scoreKeeper.moveHistory.printMoveHistory();

      operateMethodsOn([this.player1, this.player2], ['resetMove']);

      pressAnyKeyToContinue();
    } while (!this.scoreKeeper.tournamentIsWon() || this.playAgain());

    print('GoodBye');
  }

}

let rpsGame = new RPSGame();
rpsGame.playRPS();

function print(message) {
  console.log(message);
}

function wait(ms) {
  let currentTime = new Date().getTime();
  let endTime = currentTime + ms;
  while (endTime > currentTime) {
    currentTime = new Date().getTime();
  }
}

function operateMethodsOn(objects, ...methodsAndParameters) {
  methodsAndParameters.forEach(theMethodAndParameters => {
    let method = theMethodAndParameters[0];
    let parameters = theMethodAndParameters.slice(1);

    objects.forEach(object => {
      object[method](...parameters);
    });
  });
}

function randomNumBetween(min, max) {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.floor((Math.random() * (max - min + 1)) + min);
}

function lengthOfLongestString(...strings) {
  strings.sort((stringA, stringB) => {
    return stringA.length - stringB.length;
  });
  return strings[strings.length - 1].length;
}

function returnLargest(numbersArray) {
  let largest = -Infinity;

  numbersArray.forEach(number => {
    if (number > largest) {
      largest = number;
    }
  });

  return largest;
}

function makeSpaces(numberOfSpaces) {
  return ' '.repeat(numberOfSpaces);
}

function pressAnyKeyToContinue() {
  print('\n' + YELLOW + '[Press most any key to continue]' + WHITE);
  readline.keyIn();
}

function getRandomKey(inputObject) {
  let arrayOfKeys = Object.keys(inputObject);
  let randomIndex = randomNumBetween(0, arrayOfKeys.length - 1);
  return arrayOfKeys[randomIndex];
}