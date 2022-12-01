import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest, getRandomEmoji, DiscordRequest } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';
import {
  // CHALLENGE_COMMAND,
  // TEST_COMMAND,
  ENV_COMMAND,
  // EXPERTA_COMMAND,
  // INPUT_COMMAND,
  MAQUITZO_COMMAND,
  HasGuildCommands,
} from './commands.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};
const environments = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" guild command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: 'hello world ' + getRandomEmoji(),
        },
      });
    }
    
    if (name === 'maquitzo') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: '',
          embeds: [
            {
              "type": "rich",
              "title": `Hice este lindo emoji ${getRandomEmoji()} pensando en vos ... `,
              "description": ``,
              "color": 0x00FFFF,
              "footer": {
                "text": `(es mentira lo busque en fontawesome, copy paste, pero la intencion es lo que vale)`
              }
            }
          ]
        },
      });
    }
    
// await lib.discord.channels['@0.3.2'].messages.create({
//   "channel_id": `${context.params.event.channel_id}`,
//   "content": "",
//   "tts": false,
//   "embeds": [
//     {
//       "type": "rich",
//       "title": `Environments`,
//       "description": `These are all your Environments mompirri !`,
//       "color": 0x00FFFF,
//       "fields": [
//         {
//           "name": `development`,
//           "value": `free`,
//           "inline": true
//         },
//         {
//           "name": `testing`,
//           "value": `busy`
//         }
//       ],
//       "footer": {
//         "text": `Se puede usar el comando /environment para tomar alguno`
//       }
//     }
//   ]
// });
    
    // "challenge" guild command
    if (name === 'challenge' && id) {
        const userId = req.body.member.user.id;
        // User's object choice
        const objectName = req.body.data.options[0].value;

        // Create active game using message ID as the game ID
        activeGames[id] = {
            id: userId,
            objectName,
        };

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
              // Fetches a random emoji to send from a helper function
              content: `Rock papers scissors test challenge from <@${userId}>`,
              components: [
              {
                  type: MessageComponentTypes.ACTION_ROW,
                  components: [
                  {
                      type: MessageComponentTypes.BUTTON,
                      // Append the game ID to use later on
                      custom_id: `accept_button_${req.body.id}`,
                      label: 'Accept',
                      style: ButtonStyleTypes.PRIMARY,
                  },
                  ],
              },
              ],
          },
        });
    }
    

    if (name === 'experta' && id) {
        const userId = req.body.member.user.id;
        // User's object choice
        const objectName = req.body.data.options[0].value;

        // Create active game using message ID as the game ID
        activeGames[id] = {
            id: userId,
            objectName,
        };

        return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            // Fetches a random emoji to send from a helper function
            content: `Rock papers scissors test challenge from <@${userId}>`,
            components: [
            {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                      type: MessageComponentTypes.BUTTON,
                      custom_id: `accept_button_${req.body.id}`,
                      label: 'Accept',
                      style: ButtonStyleTypes.PRIMARY,
                  },
                ],
            },
            ],
        },
        });
    }

    
    // "experta" guild command
    if (name === 'input' && id) {
        const userId = req.body.member.user.id;
        // User's object choice
        const task = req.body.data.options[0].value;

        let env = "";
        let action = "";
      
        console.log('env', environments);
        console.log('task', task);
      
        switch(task) {
          case 'list':
            
            // env {
            //   development: { id: '808483336548253706', env: 'development', task: 'set' },
            //   testing: { id: '808483336548253706', env: 'testing', task: 'set' }
            // }
            const content = getEnvironmentsInfo();
            
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: content },
            });
            
            break;
            
          case 'set':
            env = req.body.data.options[1].value;
            setEnvironment(userId, env, task);
            action = "Reservando";
            break;
            
          case 'release':
            env = req.body.data.options[1].value;
            setEnvironment(userId, env, task);
            action = "Liberando";
            break;
        }

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
              // Fetches a random emoji to send from a helper function
              content: `${action} **${env}** para <@${userId}>`,
          },
        });
    }
    
    
  }
  

  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId.startsWith('accept_button_')) {
      // get the associated game ID
      const gameId = componentId.replace('accept_button_', '');
      // Delete message with token in request body
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      try {
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            // Fetches a random emoji to send from a helper function
            content: 'What is your object of choice?',
            // Indicates it'll be an ephemeral message
            flags: InteractionResponseFlags.EPHEMERAL,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.STRING_SELECT,
                    // Append game ID
                    custom_id: `select_choice_${gameId}`,
                    options: getShuffledOptions(),
                  },
                ],
              },
            ],
          },
        });
        // Delete previous message
        await DiscordRequest(endpoint, { method: 'DELETE' });
      } catch (err) {
        console.error('Error sending message:', err);
      }
    } else if (componentId.startsWith('select_choice_')) {
      // get the associated game ID
      const gameId = componentId.replace('select_choice_', '');

      if (activeGames[gameId]) {
        // Get user ID and object choice for responding user
        const userId = req.body.member.user.id;
        const objectName = data.values[0];
        // Calculate result from helper function
        const resultStr = getResult(activeGames[gameId], {
          id: userId,
          objectName,
        });

        // Remove game from storage
        delete activeGames[gameId];
        // Update message with token in request body
        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

        try {
          // Send results
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: resultStr },
          });
          // Update ephemeral message
          await DiscordRequest(endpoint, {
            method: 'PATCH',
            body: {
              content: 'Nice choice ' + getRandomEmoji(),
              components: []
            }
          });
        } catch (err) {
          console.error('Error sending message:', err);
        }
      }
    }
  }
  
  // BEGIN environments
  
  if (type === InteractionType.APPLICATION_COMMAND) {
    
    if (data.name === 'environments') {
      
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '> Available Environment Options \n',
          
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  // Value for your app to identify the select menu interactions
                  custom_id: 'options_environment_select',
                  "placeholder": "Choose an environment",
                  // Select options - see https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
                  options: [
                    {
                      label: 'LIST',
                      value: 'list',
                      description: 'Disponibilidad de los ambientes',
                    },
                    {
                      label: 'RESERVE',
                      value: 'set',
                      description: 'Reservalo con pesos, si lo liberas en un rato te devuelvo la guita',
                    },
                    {
                      label: 'CANCEL',
                      value: 'release',
                      description: 'FreeWilly pero con el ambiente',
                    },
                  ],
                },
              ],
            }
          ],
        },
      });
    }
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId === 'options_environment_select') {
      //console.log(req.body);

      // Get selected option from payload
      const selectedOption = data.values[0];
      const userId = req.body.member.user.id;
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      
      switch(selectedOption) {
        case 'list':

          // Send results
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { 
              content: '',
              embeds : [
              {
                "type": "rich",
                "title": `Environments`,
                "description": `These are the states of each environment registered in me.`,
                "color": 0x00FFFF,
                "fields": getEnvironmentsInfo(userId),
                "footer": {
                  "text": `Remember to use /environment and next Reservar to change any`
                }
              }
            ]
            },
          });
          break;
          
        case 'set':
        case 'release':
          
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '> Choose Environment \n',
              // Selects are inside of action rows
              components: [
                {
                  type: MessageComponentTypes.ACTION_ROW,
                  components: [
                    {
                      type: MessageComponentTypes.STRING_SELECT,
                      // Value for your app to identify the select menu interactions
                      custom_id: 'environment_select',
                      // Select options - see https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
                      options: [
                        {
                          label: 'DEVELOPMENT',
                          value: `${selectedOption}-development`,
                          description: 'Features branchs',
                        },
                        {
                          label: 'STAGING',
                          value: `${selectedOption}-staging`,
                          description: 'Features branchs',
                        },
                        {
                          label: 'TESTING',
                          value: `${selectedOption}-testing`,
                          description: 'Sprint Release',
                        },
                        {
                          label: 'PRODUCTION',
                          value: `${selectedOption}-production`,
                          description: 'Release ended, master branch',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          });
          break;
          
      }
      
      try {
        //await DiscordRequest(endpoint, { method: 'DELETE' });
        await DiscordRequest(endpoint, {
          method: 'PATCH',
          body: {
            content: '> Selected something ! ' + getRandomEmoji(),
            components: []
          }
        });
        
      } catch (err) {
        console.error('Error sending message:', err);
      }

    }
  
    if (componentId === 'environment_select') {

        const selectedOption = data.values[0];
        const userId = req.body.member.user.id;
        const options = selectedOption.split("-");
        // Keep selection
        setEnvironment(userId, options[1], options[0]);

        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

        try {
          // Send results
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { 
              content: '',
              embeds : [
              {
                "type": "rich",
                "title": `Environments`,
                "description": `These are the states of each environment registered in me.`,
                "color": 0x00FFFF,
                "fields": getEnvironmentsInfo(userId),
                "footer": {
                  "text": `Remember to use /environment and next Reservar to change any`
                }
              }
            ]
            },
          });
          
          // Update ephemeral message
          await DiscordRequest(endpoint, {
            method: 'PATCH',
            body: {
              content: '> Nice choice ' + getRandomEmoji(),
              components: []
            }
          });
          
        } catch (err) {
          console.error('Error sending message:', err);
        }

      }
  
  }
  
  // END environments
  
  
  // TODO poner todo esto en utils
  function getTimestampFormat (timestamp) {
    
    return new Date(timestamp).toUTCString().replace( / GMT$/, "" );
    
  }
  
  function getEnvironmentsInfo(UserId) {
    
    const envs = ['development', 'testing', 'staging', 'production'];
    
    const ICON_NOENV = ':blue_heart:';
    const ICON_ENV = ':heart:';
    
    // let content = `> \n`;
    // content += `> We got this environments registered <@${UserId}> :\n`;
    
    let icon = ICON_NOENV;
    let fields = [];

    for(let i = 0; i < envs.length; i++) {
      
      const e = environments[envs[i]];
      
      if (e) {
        icon = (e.task == 'set'? ICON_ENV : ICON_NOENV);
        //content += `> ${icon}   **${envs[i]}** used by <@${e.id}> since ${getTimestamp(e.timestamp)}\n`;
        
        fields.push({
            "name": `${envs[i]}  ${icon}`,
            "value": `used by <@${e.id}> since ${getTimestampFormat(e.timestamp)}`
        });
        
      }
      else {
        //content += `> ${ICON_NOENV}   **${envs[i]}** \n`;
        
        fields.push({
            "name": `${envs[i]}  ${ICON_NOENV}`,
            "value": "\u200B"
        });
      }

    };
    

//     if (content == "") 
//       content = ":man_facepalming: I Haven't any environment registered";
    
    return fields;
    
  }
  
  function getTimeStamp(){
    
      var now = new Date();
      var offset = -3 * 3600 * 1000; //now.getTimezoneOffset();
      //let d = new Date(new Date().toLocaleString("en-US", {timeZone: "timezone id"}));

      return new Date(now.getTime() + offset);
  }
  
  function setEnvironment(userId,env,task) {
    
      if (task == 'release')
        delete environments[env];
        
      else 
        environments[env] = {
            id: userId,
            timestamp: getTimeStamp(),
            task: task
        };
      

    
      //console.log("after setting", environments);
  }
  
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.json are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    //TEST_COMMAND,
    //CHALLENGE_COMMAND,
    ENV_COMMAND,
    //EXPERTA_COMMAND,
    //INPUT_COMMAND,
    MAQUITZO_COMMAND
  ]);
});