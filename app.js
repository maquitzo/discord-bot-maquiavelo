import express from 'express';
import 'dotenv/config'

let db = {};

import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';

import { VerifyDiscordRequest, getRandomEmoji, DiscordRequest } from './utils.js';

import { 
  getShuffledOptions, 
  getResult, 
  initiliazeDB,
  getRPSEnvironments, 
  setRPSEnvironments,
  setRPSEnvironmentsAsync
} from './game.js';

import {
  CHALLENGE_COMMAND,
  TEST_COMMAND,
  ENV_COMMAND,
  EXPERTA_COMMAND,
  // INPUT_COMMAND,
  MAQUITZO_COMMAND,
  TINCHO_COMMAND,
  IND_COMMAND,
  HasGuildCommands,
} from './commands.js';

import {
  getInteractionMaquitzo,
  getInteractionTincho,
  getInteractionEnvironment,
  getInteractionIndependiente,
  getInteractionEnvironmentCommand,
  getInteractionFinal,
  setEnvironment
} from './interactions.js';

// Create an express app
const app = express();
// variables

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));


// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};
const environments = {};

var accionSeleccionada = '';
var ambienteSeleccionado = '';
var usuarioReserva = 0;
var cardSeleccionada = '';

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  
  console.log('interactions ');
  
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
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: getEnvironmentsInfo() },
            });
            break;
            
          case 'set':
            env = req.body.data.options[1].value;
            setEnvironment(userId, env, task, '');
            action = "Reservando";
            break;
            
          case 'release':
            env = req.body.data.options[1].value;
            setEnvironment(userId, env, task, '');
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
      
    } 
    
    if (componentId.startsWith('select_choice_')) {
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
  
  
  if (type === InteractionType.APPLICATION_COMMAND) {
    
    const { name } = data;
    const userId = req.body.member.user.id;
    
    if (name === 'maquitzo') {
      // Send a message into the channel where command was triggered from
      return res.send(getInteractionMaquitzo());
    }
    
    if (data.name === 'environments') {
      return res.send(getInteractionEnvironment(userId,db, req.body.id));
    }
    
    if (data.name === 'independiente') {
      return res.send(getInteractionIndependiente(userId));
    }
        
    if (data.name === 'tincho') {     
      return res.send(getInteractionTincho(userId));      
    }
  }
  
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;
    
    if (componentId === 'tincho_options_environment_select') {
      
      // Get selected option from payload
      const selectedOption = data.values[0];
      const userId = req.body.member.user.id;
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      
      accionSeleccionada = selectedOption;
      console.log('accionSeleccionada: ', accionSeleccionada);
      
      switch(selectedOption) {
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
                      custom_id: 'tincho_environment_select',
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
                      ],
                    },
                  ],
                },
              ],
              "embeds": [
                {
                  "type": "rich",
                  "title": `Selección de ambiente`,
                  "description": `Go <@${userId}>!`,
                  "color": 0x1eff00,
                  "footer": {
                  "text": `Recordá usar "/environments" para ver disponibilidad.`
                  }
                }
              ]
            },
          });
          break;
          
      }
      
      try {
        await DiscordRequest(endpoint, { method: 'DELETE' });        
      } 
      catch (err) {
        console.error('Error sending message:', err);
      }

    }
    
    if (componentId === 'tincho_environment_select') {

        const selectedOption = data.values[0];
        const userId = req.body.member.user.id;
        const options = selectedOption.split("-");
        
        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
        
        ambienteSeleccionado = options[1];              
                    
        if (accionSeleccionada == 'release') {

          if (environments[ambienteSeleccionado]) {            

            setEnvironment(userId, ambienteSeleccionado, accionSeleccionada, '');

            await res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { 
                content: '',
                embeds : [
                {
                  "type": "rich",
                  "title": 'Éxito!',
                  "description": `El ambiente ${ ambienteSeleccionado } fue liberado.`,
                  "color": 0x00FFFF,
                  "fields": getEnvironmentsInfo(selectedOption),
                  "footer": {
                    "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
                  }
                }
              ]
              },
            });

          }
          else {
            await res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { 
                content: '',
                embeds : [
                {
                  "type": "rich",
                  "title": 'Error!',
                  "description": `<@${userId}> el ambiente No se encuentra ocupado.`,//`<@${selectedOption}> is the CHOSEN.`,
                  "color": 0x00FFFF,
                  "fields": getEnvironmentsInfo(selectedOption),
                  "footer": {
                    "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
                  }
                }
              ]
              },
            });
          }
        }
        else {

          await res.send({

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
                content: '',
                embeds : [
                  {
                    "type": "rich",
                    "title": 'Selección de usuario',
                    "description": `<@${userId}> seleccioná el usuario que hará las pruebas.`,
                    "color": 0x00FFFF,
                    "fields": [],
                    "footer": {
                      "text": `Recordá usar "/environments" para ver disponibilidad.`
                    }
                  }
                ]

              },
            });            
        }
      
      try {
        // Update ephemeral message
        await DiscordRequest(endpoint, { method: 'DELETE' });          
      } 
      catch (err) {
        console.error('Error sending message:', err);
      }

    }
  
    if (componentId === 'reserva_user') {
      
      const selectedOption = data.values[0];
      const userId = req.body.member.user.id;
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      
      usuarioReserva = selectedOption;      
        
      // Validaciones        
      if (accionSeleccionada == 'set') {
        if (environments[ambienteSeleccionado]) {

          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { 
              content: '',
              embeds : [
              {
                "type": "rich",
                "title": 'Error!',
                "description": `El ambiente ${ ambienteSeleccionado } está ocupado!!`,
                "color": 0x00FFFF,
                "fields": getEnvironmentsInfo(selectedOption),
                "footer": {
                  "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
                }
              }
            ]
            },
          });
        }
        else {

          // Acá debo lanzar el modal para meter la card en cuestión.        
          return res.send({
            type: InteractionResponseType.APPLICATION_MODAL,
            data: {
              custom_id: 'modal_card',
              title: 'Selección de card',
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
                      label: 'Ingresá el número de la card a probar.',                    
                      placeholder: '42',
                    },
                  ],
                }
              ],
            },
          });

        }
      }
       
      try {
        // Update ephemeral message
        await DiscordRequest(endpoint, { method: 'DELETE' });          
      } 
      catch (err) {
        console.error('Error sending message:', err);
      }        
      
    }
    
    if (componentId.startsWith('environment_action')) {
      
      const userId = req.body.member.user.id;
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      
      // get the associated game ID
      const options = componentId.replace('environment_action', '').split('|');
      
      const action = options[1];
      const environment = options[2];
      const reqbody = options[3];
      
      if (action == 'set') 
        return res.send(getInteractionEnvironmentCommand(action,environment,db));
      else
        setEnvironment(action, {name:environment}, db).then(response => res.send(getInteractionFinal(environment, userId)));
        
        
      try {
        // Update ephemeral message
        await DiscordRequest(endpoint, { method: 'DELETE' });          
      } 
      catch (err) {
        console.error('Error sending message:', err);
      }   
      
    } 

  }

  if (type === InteractionType.APPLICATION_MODAL_SUBMIT) {
    // custom_id of modal
    const modalId = data.custom_id;
    // user ID of member who filled out modal
    const userId = req.body.member.user.id;
    
    if (modalId === 'modal_card') {
      
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      
      let modalValues = '';
      // Get value of text inputs
      for (let action of data.components) {
        let inputComponent = action.components[0];
        modalValues += `${inputComponent.value}\n`;
      }

      cardSeleccionada = modalValues;

      setEnvironment(usuarioReserva, ambienteSeleccionado, accionSeleccionada, cardSeleccionada);

      await res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { 
              content: '',
              embeds : [
              {
                "type": "rich",
                "title": 'Éxito!',
                "description": `El ambiente ${ ambienteSeleccionado } fue reservado para <@${ usuarioReserva }>. `,
                "color": 0x00FFFF,
                "fields": getEnvironmentsInfo(ambienteSeleccionado),
                "footer": {
                  "text": `Recordá usar "/environments" para ver disponibilidad.`
                }
              }
            ]
        },
      });
      
      try {
        // Update ephemeral message
        await DiscordRequest(endpoint, { method: 'DELETE' });    
      }
      catch (err) 
      {
        console.error('Error sending message:', err);
      } 
      
      
    }
    
    if (modalId.startsWith('popup_')) {

        let modalValues = '';

        // Get value of text inputs
        for (let action of data.components) {
          let inputComponent = action.components[0];
          modalValues += `${inputComponent.value}|`;
        }

        const action = modalId.split('|')[1];
      
        const environment = {
          name: modalId.split('|')[2],
          branch: modalValues.split('|')[2],
          card: modalValues.split('|')[0],
          user: {
            tester: modalValues.split('|')[1],
            dev: userId,
          },
        };

        setEnvironment(action, environment, db).then(response => res.send(getInteractionFinal(environment, userId)));

      }
    
  }  
  
  
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
  console.log('Checking Guild Commands');

  db = initiliazeDB();
  
  // Check if guild commands from commands.json are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    TEST_COMMAND,
    CHALLENGE_COMMAND,
    ENV_COMMAND,
    EXPERTA_COMMAND,
    //INPUT_COMMAND,
    MAQUITZO_COMMAND,
    TINCHO_COMMAND,
    IND_COMMAND
  ]);
});