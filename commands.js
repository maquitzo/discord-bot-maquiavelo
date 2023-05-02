import { getRPSChoices, getRPSEnvironments } from './game.js';
import { capitalize, DiscordRequest } from './utils.js';

export async function HasGuildCommands(appId, guildId, commands) {
  
  console.log(appId, " ", guildId);
  if (guildId === '' || appId === '') return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const data = await res.json();
    
    //console.log('data',data);

    if (data) {
      const installedNames = data.map((c) => c['name']);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command['name'])) {
        console.log(`Installing "${command['name']}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(`"${command['name']}" command already installed`);
        if (command['name'] == "environments" || command['name'] == "tincho")  {
          console.log(`"${command['name']}" command already installed .. updating`);
          InstallGuildCommand(appId, guildId, command);
        }
        
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // install command
  try {
    await DiscordRequest(endpoint, { method: 'POST', body: command });
  } catch (err) {
    console.error(err);
  }
}



// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Get the game choices from game.js
function createCommandEnvironments() {
  const choices = getRPSEnvironments();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// function createCommandOptions() {
//   const choices = getRPSOptions();
//   const commandChoices = [];

//   for (let choice of choices) {
//     commandChoices.push({
//       name: capitalize(choice),
//       value: choice.toLowerCase(),
//     });
//   }

//   return commandChoices;
// }

// Simple test command
export const TEST_COMMAND = {
  name: 'test',
  description: 'Basic guild command',
  type: 1,
};

export const MAQUITZO_COMMAND = {
  name: 'maquitzo',
  description: 'Random',
  type: 1,
};

export const TINCHO_COMMAND = {
  name: 'tincho',
  description: 'Pruebas varias',
  type: 1,
};


// Command containing options
export const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
};


// export const INPUT_COMMAND = {
//   name: 'input',
//   description: 'Environments Papu',
//   options: [
//       {
//       type: 3,
//       name: 'action',
//       description: 'Opciones',
//       required: true,
//       choices: createCommandOptions(),
//     },
//     {
//       type: 3,
//       name: 'env',
//       description: 'Entornos disponibles',
//       required: false,
//       choices: createCommandEnvironments(),
//     },

//   ],
//   type: 1,
// };

// export const EXPERTA_COMMAND = {
//   name: 'experta',
//   description: 'Reserva y visualizacion de Entornos',
//   options: [
//     {
//       type: 3,
//       name: 'entorno',
//       description: 'Entornos disponibles',
//       required: false,
//       choices: createCommandEnvironments(),
//     },
//     {
//       type: 3,
//       name: 'accion',
//       description: 'Acciones disponibles sobre los entornos',
//       required: false,
//       choices: createCommandOptions(),
//     },
//   ],
//   type: 1,
// };

export const ENV_COMMAND = {
  name: 'environments',
  description: 'Que seriamos sin ellos...',
  type: 1,
};

export const IND_COMMAND = {
  name: 'independiente',
  description: 'sin palabras',
  type: 1,
};

export const EXPERTA_COMMAND = {
  name: 'experta',
  description: 'We are experta',
  type: 1,
};