import { capitalize } from './utils.js';
import DataStore from 'nedb';

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
    id:1,
    name:'desarrollo',
    label:'Dev',
    description: 'El ambiente del pueblo',
    card:'',
    state: 0,
    timestamp:'',
    user:{
      dev:'',
      tester:'',
    },
    url : {
      frontend:'http://cluster-test.art.com:20478/',
      backend:'http://cluster-test.art.com:20478/'
    }
  },
  {
    id:2,
    name:'testing',
    label:'Test',
    description: 'Siempre esta el Release v1X.00.00',
    card:'77',
    state: 1,
    timestamp:'2020-04-20 12:00',
    user:{
      dev: 808483336548253706,
      tester:'brokers',
    },
    url : {
      frontend:'http://cluster-test.art.com:20536/',
      backend:'http://cluster-test.art.com:20536/'
    }
  },
  {
    id:3,
    name:'staging',
    label:'Staging',
    description: 'Es un pre-productivo',
    card:'',
    state: 0,
    timestamp:'',
    user:{
      dev:'',
      tester:'',
    },
    url : {
      frontend:'http://cluster-test.art.com:20283/',
      backend:'http://cluster-test.art.com:20283/'
    }
  },
  {
    id:4,
    name:'demo',
    label:'Demo',
    description: 'Usado para el dia de la Demo o Epica',
    card:'',
    state: 0,
    timestamp:'',
    user:{
      dev:'',
      tester:'',
    },
    url : {
      frontend:'http://cluster-test.art.com:20567/',
      backend:'http://cluster-test.art.com:20567/'
    }
  },
]

export function initiliazeDB() {
  
    //datastore
  const db = new DataStore({ filename: './data/datastore.db', autoload:true });
  
  //db.remove({}, { multi: true }, function (err, numRemoved) { console.log('remove all') });
  
  db.count({}, function (err, count) {
    
    console.log('Check existing entries on file- >', count, " |err? ", err);
    
    if (count == 0) {
      
      console.log('Inserting default values -> ', RPSEnvironments.length);
      
      db.insert(RPSEnvironments);
    
    } else {

      rehytrate(db);
      
    }

  });
  
  return db;
  
}

function rehytrate(db) {
  
  return db.find({}, function (err, env) {
    //console.log('Rehidrate files', env[0]);
    RPSEnvironments = env;
    return RPSEnvironments;
  });

}

function rehytrate2(db){
  
    return new Promise((resolve, reject) => {
        db.find({}, (err, doc) => {
            if (err) 
              reject(err) 
            else 
              { 
                RPSEnvironments = doc; 
                resolve(doc) 
              };
        });
    });
  
}

// export function getRPSEnvironmentsKeys() {
//   return Object.keys(RPSEnvironments);
// }

export function getRPSEnvironments(db) {
  return RPSEnvironments;
}

export function setRPSEnvironments(env,data,db) {
  
  //console.log(env,data);
  //RPSEnvironments = {...RPSEnvironments,  [env] : data };
  db.update({ name:env }, { $set: data }, {}, function (err, numReplaced) {
    console.log('saving err ',err,' num:',numReplaced);
    rehytrate(db);
  });
  
}

export async function setRPSEnvironmentsAsync(env,data,db) {
  console.log(env,data);
  return new Promise((resolve, reject) => {
    db.update({ name:env }, { $set: data }, {}, (err, numReplaced) => {
        
      if (err) {
          
          reject(err) 
        }
        else {
          resolve(rehytrate2(db))
        }
           
      });
  });
  
}