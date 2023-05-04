import { capitalize } from './utils.js';

export function getResult(p1, p2) {
  let gameResult;
  if (RPSChoices[p1.objectName] && RPSChoices[p1.objectName][p2.objectName]) {
    // o1 wins
    gameResult = {
      win: p1,
      lose: p2,
      verb: RPSChoices[p1.objectName][p2.objectName],
    };
  } else if (
    RPSChoices[p2.objectName] &&
    RPSChoices[p2.objectName][p1.objectName]
  ) {
    // o2 wins
    gameResult = {
      win: p2,
      lose: p1,
      verb: RPSChoices[p2.objectName][p1.objectName],
    };
  } else {
    // tie -- win/lose don't
    gameResult = { win: p1, lose: p2, verb: 'tie' };
  }

  return formatResult(gameResult);
}

function formatResult(result) {
  const { win, lose, verb } = result;
  return verb === 'tie'
    ? `<@${win.id}> and <@${lose.id}> draw with **${win.objectName}**`
    : `<@${win.id}>'s **${win.objectName}** ${verb} <@${lose.id}>'s **${lose.objectName}**`;
}

// this is just to figure out winner + verb
const RPSChoices = {
  rock: {
    description: 'sedimentary, igneous, or perhaps even metamorphic',
    virus: 'outwaits',
    computer: 'smashes',
    scissors: 'crushes',
  },
  cowboy: {
    description: 'yeehaw~',
    scissors: 'puts away',
    wumpus: 'lassos',
    rock: 'steel-toe kicks',
  },
  scissors: {
    description: 'careful ! sharp ! edges !!',
    paper: 'cuts',
    computer: 'cuts cord of',
    virus: 'cuts DNA of',
  },
  virus: {
    description: 'genetic mutation, malware, or something inbetween',
    cowboy: 'infects',
    computer: 'corrupts',
    wumpus: 'infects',
  },
  computer: {
    description: 'beep boop beep bzzrrhggggg',
    cowboy: 'overwhelms',
    paper: 'uninstalls firmware for',
    wumpus: 'deletes assets for',
  },
  wumpus: {
    description: 'the purple Discord fella',
    paper: 'draws picture on',
    rock: 'paints cute face on',
    scissors: 'admires own reflection in',
  },
  paper: {
    description: 'versatile and iconic',
    virus: 'ignores',
    cowboy: 'gives papercut to',
    rock: 'covers',
  },
};

export function getRPSChoices() {
  return Object.keys(RPSChoices);
}

// Function to fetch shuffled options for select menu
export function getShuffledOptions() {
  const allChoices = getRPSChoices();
  const options = [];

  for (let c of allChoices) {
    // Formatted for select menus
    // https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
    options.push({
      label: capitalize(c),
      value: c.toLowerCase(),
      description: RPSChoices[c]['description'],
    });
  }

  return options.sort(() => Math.random() - 0.5);
}

let RPSEnvironments = [
  {
    id:'desarrollo',
    label:'Desarrollo',
    description: 'Desarrollo',
    dev:'',
    tester:'',
    card:'',
    state: 0,
    timestamp:'',
    user:{}
  },
  {
    id:'testing',
    label:'testing',
    description: 'Release v14.00.XX',
    dev: 808483336548253706,
    tester:'brokers',
    card:'',
    state: 1,
    timestamp:'2020-04-03T13:49:01.767Z',
    user:{}
  },
  {
    id:'staging',
    label:'testing',
    description: 'Staging',
    dev:'',
    tester:'',
    card:'',
    state: 0,
    timestamp:'',
    user:{}
  },
  {
    id:'demo',
    label:'testing',
    description: 'Ambiente para una Demo en particular ',
    dev:'',
    tester:'',
    card:'',
    state: 0,
    timestamp:'',
    user:{}
  },
]

export function getRPSEnvironmentsKeys() {
  return Object.keys(RPSEnvironments);
}

export function getRPSEnvironments(db) {
  
  db.count({ id:'demo'}, function (err, count) {
    
    console.log('count', count, "err ", err);
    
    if (count == 0) {
      
      console.log('insert all', getRPSEnvironmentsKeys().length);
      db.insert(RPSEnvironments);
    
    } else {

      db.find({}, function (err, env) {
        console.log('loading', env);
        RPSEnvironments = env;
      });
    }

  });
  
  const allChoices = getRPSEnvironments();
  const options = [];

  for (let c of allChoices) {
    // Formatted for select menus
    // https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
      options.push({
        label: RPSEnvironments[c]['label'],
        value: c,
        ...RPSEnvironments[c]
      });
  }
  
  //console.log("environment:",options);
  //return options;
  
  return RPSEnvironments;
}

export function setRPSEnvironments(env,data,db) {
  
  RPSEnvironments = {...RPSEnvironments,  [env] : data };
  
  db.update({env:data}, {env:data}, {}, function (err, numReplaced) {
    console.log('saving err ',err,' num:',numReplaced);
  });
  
}

