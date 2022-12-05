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
  EXPERTA_COMMAND,
  // INPUT_COMMAND,
  MAQUITZO_COMMAND,
  TINCHO_COMMAND,
  IND_COMMAND,
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
    

    if (name === 'experta') {
      
        /*return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            custom_id: 'inputuser',
            title: 'inputconuser',
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: 5,
                    custom_id: 'reserva_user',
                    label: 'User',
                  },
                ],
              }
            ],
          },
        });*/
      
      return res.send({
        type: InteractionResponseType.APPLICATION_MODAL,
        data: {
          custom_id: 'modal_reserva',
          title: 'Reserva',
          components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: 'reserva_branch',
                    style: 1,
                    label: 'Branch a desplegar',
                  },
                ],
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: 'reserva_user_test',
                    style: 1,
                    label: 'Quien lo va a probar',
                  },
                ],
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                      type: MessageComponentTypes.STRING_SELECT,
                      custom_id: 'environment_select',
                      options: [
                        {
                          label: 'DEVELOPMENT',
                          value: `development`,
                          description: 'Features branches',
                        },
                      ]
                  }
                ],
              },
              /*{
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: 5,
                    label: 'user',
                    custom_id: "user_rserva",
                  }
                ],
              },*/
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
      
      const userId = req.body.member.user.id;
      
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '',
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  custom_id: 'options_environment_select',
                  "placeholder": "Seleccionar opción",
                  options: [
                    {
                      label: 'LISTAR',
                      value: 'list',
                      description: 'Disponibilidad de los ambientes',
                    },
                    {
                      label: 'RESERVAR',
                      value: 'set',
                      description: 'Reserválo con pesos, si lo liberáss en un rato te devuelvo la guita',
                    },
                    {
                      label: 'LIBERAR',
                      value: 'release',
                      description: 'FreeWilly pero con el ambiente',
                    },
                  ],
                },
              ],
            }
          ],
          "embeds": [
            {
              "type": "rich",
              "title": `Entornos`,
              "description": `¿Qué harás ahora <@${userId}> ?`,
              "color": 0xff2200,
              "timestamp": getTimeStamp(),
              "footer": {
                "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
              }
            }
          ]
        },
      });
    }
    
    if (data.name === 'independiente') {
      
      const userId = req.body.member.user.id;
      
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '',
          embeds: [
            {
              "type": "rich",
              "title": `No es por ahí rey !! `,
              "description": `Mi corazonzito tiene otros colores`,
              "color": 0x0099ff,
              "image": {
                "url": getGiphy(),
                "height": null,
                "width": null
              }
            }
          ]
        },
      });
    }
    
    // Tincho
    if (data.name === 'tincho') {
      
      const userId = req.body.member.user.id;
      
      await res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { 
          content: '',
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Value for your app to identify the button
                  custom_id: 'my_button_1',
                  label: 'Click 1',
                  style: ButtonStyleTypes.PRIMARY,
                },
                {
                  type: MessageComponentTypes.BUTTON,
                  // Value for your app to identify the button
                  custom_id: 'my_button_2',
                  label: 'Click 2',
                  style: ButtonStyleTypes.SUCCESS,
                },
              ],
            },
          ],
          embeds : [
            {
            "type": "rich",
            "title": `Entornos`,
            "description": `Estado de los ambientes`,
            "color": 0x00FFFF,
            "fields": getEnvironmentsInfo(userId),
            "footer": {
              "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
              }
            }
          ]
        },
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { 
          content: '',
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Value for your app to identify the button
                  custom_id: 'my_button_3',
                  label: 'Click 3',
                  style: ButtonStyleTypes.PRIMARY,
                },
                {
                  type: MessageComponentTypes.BUTTON,
                  // Value for your app to identify the button
                  custom_id: 'my_button_4',
                  label: 'Click 4',
                  style: 1 + 1 !== 2 ? ButtonStyleTypes.SUCCESS : ButtonStyleTypes.DESTRUCTIVE,
                },
              ],
            },
          ],
          embeds : [
            {
            "type": "rich",
            "title": `Entornos`,
            "description": `Estado II de los ambientes`,
            "color": 0x00FFFF,
            "fields": getEnvironmentsInfo(userId),
            "footer": {
              "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
              }
            }
          ]
        },
      });		
      /*
      return res.send({
        type: InteractionResponseType.APPLICATION_MODAL,
        data: {
          custom_id: 'my_modal',
          title: 'Modal title',
          components: [
            {
              // Text inputs must be inside of an action component
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  // See https://discord.com/developers/docs/interactions/message-components#text-inputs-text-input-structure
                  type: MessageComponentTypes.INPUT_TEXT,
                  custom_id: 'my_text',
                  style: 1,
                  label: 'Type some text',
                },
              ],
            },
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.INPUT_TEXT,
                  custom_id: 'my_longer_text',
                  // Bigger text box for input
                  style: 2,
                  label: 'Type some (longer) text',
                },
              ],
            },
          ],
        },
      });
      */
    }
  }

  if (type === InteractionType.APPLICATION_MODAL_SUBMIT) {
    // custom_id of modal
    const modalId = data.custom_id;
    // user ID of member who filled out modal
    const userId = req.body.member.user.id;

    if (modalId === 'my_modal') {
      let modalValues = '';
      // Get value of text inputs
      for (let action of data.components) {
        let inputComponent = action.components[0];
        modalValues += `${inputComponent.custom_id}: ${inputComponent.value}\n`;
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `<@${userId}> typed the following (in a modal):\n\n${modalValues}`,
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
                "title": `Entornos`,
                "description": `Acá se muestra el estado de cada ambiente`,
                "color": 0x00FFFF,
                "fields": getEnvironmentsInfo(userId),
                "footer": {
                  "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
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
              content: '',
              components: [
                {
                  type: MessageComponentTypes.ACTION_ROW,
                  components: [
                    {
                      type: MessageComponentTypes.STRING_SELECT,
                      custom_id: 'environment_select',
                      options: [
                        {
                          label: 'DEVELOPMENT',
                          value: `${selectedOption}-development`,
                          description: 'Features branches',
                        },
                        {
                          label: 'STAGING',
                          value: `${selectedOption}-staging`,
                          description: 'Features branches',
                        },
                        {
                          label: 'TESTING',
                          value: `${selectedOption}-testing`,
                          description: 'Sprint Release',
                        },
                        /*{
                          label: 'PRODUCTION',
                          value: `${selectedOption}-production`,
                          description: 'Release ended, master branch',
                        },*/
                      ],
                    },
                  ],
                },
              ],
              "embeds": [
                {
                  "type": "rich",
                  "title": `Entornos`,
                  "description": `Seleccioná un ambiente <@${userId}>`,
                  "color": 0x1eff00,
                  "timestamp": getTimeStamp(),
                  "footer": {
                    "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
                  }
                }
              ]
            },
          });
          break;
          
      }
      
      try {
        await DiscordRequest(endpoint, { method: 'DELETE' });
        // await DiscordRequest(endpoint, {
        //   method: 'PATCH',
        //   body: {
        //     content: '> Selected something ! ' + getRandomEmoji(),
        //     components: []
        //   }
        // });
        
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
                "title": `Entornos`,
                "description": `Acá se muestra el estado de cada ambiente <@${userId}>.`,
                "color": 0x00FFFF,
                "fields": getEnvironmentsInfo(userId),
                "footer": {
                  "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
                }
              }
            ]
            },
          });
          
          // Update ephemeral message
          await DiscordRequest(endpoint, { method: 'DELETE' });
          // await DiscordRequest(endpoint, {
          //   method: 'PATCH',
          //   body: {
          //     content: '> Nice choice ' + getRandomEmoji(),
          //     components: []
          //   }
          // });
          
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
    
    const envs = ['development', 'testing', 'staging'];
    
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
            "value": `used by <@${e.id}> since ${getTimestampFormat(e.timestamp)}`,
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
      console.log("Ambiente: ", environments[env]);
      
      if (task == 'release') {
        // delete environments[env]; original maqui
        if (environments[env]) {
            delete environments[env]; 
          }
          else { 
            showMessage('El ambiente NO se encuentra ocupado!');
          }
      }
      else {
        if (task == 'set') {
          if (environments[env]) {
            console.log("ESTA OCUPADO!");
          }
          else {            
            environments[env] = {
              id: userId,
              timestamp: getTimeStamp(),
              task: task
            };
            showMessage(`El ambiente "${ env }" fue reservado por <@${userId}>.`);
          }
        }
        /* original maqui
        environments[env] = {
            id: userId,
            timestamp: getTimeStamp(),
            task: task
        };
        */ 
      } 
      //console.log("after setting", environments);
  }
  
  function showMessage(message) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: message },
    });
  }
  
  function getGiphy() {
    
    const gifs = [
      'https://assets.goal.com/v3/assets/bltcc7a7ffd2fbf71f5/blt0bf817df67665b1d/60dd2709fd14d30f3eb31356/09707a11ec4943062b5446f04ebe7a3a4959c2c9.jpg?auto=webp&fit=crop&format=jpg&height=800&quality=60&width=1200',
      'https://pm1.narvii.com/6617/90112fae9b68e6c7dbee4768ab23998099e3d2e7_hq.jpg',
      'https://www.ole.com.ar/images/2022/04/02/Jbg5N_LoQ_340x340__1.jpg',
      'https://media.tycsports.com/files/2021/08/24/323286/estadio-racing-cilindro_862x485.jpg'
    ];

    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
  
    return randomGif;
  }
  
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.json are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    //TEST_COMMAND,
    //CHALLENGE_COMMAND,
    ENV_COMMAND,
    EXPERTA_COMMAND,
    //INPUT_COMMAND,
    MAQUITZO_COMMAND,
    TINCHO_COMMAND,
    IND_COMMAND
  ]);
});