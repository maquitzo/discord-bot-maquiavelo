import express from 'express';
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
  getRPSEnvironments, 
  getRPSEnvironmentsKeys, 
  getRPSEnvironmentsAvailables,
  setRPSEnvironments
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

// Create an express app
const app = express();
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
          //content: content,
          flags: InteractionResponseFlags.EPHEMERAL,
          components: [
            {
                type: MessageComponentTypes.ACTION_ROW,
                components: getEnvironmentsActions(),
            },
          ],
          "embeds" : getEnvironmentsList(userId),
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
              "title": `No es por ahí rey !!! !!! `,
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
        
    if (data.name === 'tincho') {
      
      const userId = req.body.member.user.id;      
    
      // Send results
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
                  custom_id: 'tincho_options_environment_select',
                  "placeholder": "Haz una selección",
                  options: [
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
          embeds : [
            {
              "type": "rich",
              "title": `Disponibilidad de entornos`,
              "description": `El estado de disponibilidad de cada uno`,
              "color": 0x00FFFF,
              "fields": getEnvironmentsInfo(userId),
              "footer": {
                "text": `Recordá usar "/environments" para ver disponibilidad.`
              }
            }
          ]
        },
      });      
      
      
    }
  }
  
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

//     if (componentId === 'options_environment_select') {
//       //console.log(req.body);

//       // Get selected option from payload
//       const selectedOption = data.values[0];
//       const userId = req.body.member.user.id;
//       const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      
//       switch(selectedOption) {
//         case 'list':

//           // Send results
//           await res.send({
//             type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
//             data: { 
//               content: '',
//               embeds : getEnvironmentsList(userId),
//             }
//           });
//           break;
          
//         case 'set':
//         case 'release':
          
//           await res.send({
//             type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
//             data: {
//               content: '',
//               components: [
//                 {
//                   type: MessageComponentTypes.ACTION_ROW,
//                   components: [
//                     {
//                       type: MessageComponentTypes.STRING_SELECT,
//                       custom_id: 'environment_select',
//                       options: [
//                         {
//                           label: 'DEVELOPMENT',
//                           value: `${selectedOption}-development`,
//                           description: 'Features branches',
//                         },
//                         {
//                           label: 'STAGING',
//                           value: `${selectedOption}-staging`,
//                           description: 'Features branches',
//                         },
//                         {
//                           label: 'TESTING',
//                           value: `${selectedOption}-testing`,
//                           description: 'Sprint Release',
//                         },
                        
//                       ],
//                     },
//                   ],
//                 },
//               ],
//               "embeds": [
//                 {
//                   "type": "rich",
//                   "title": `Entornos`,
//                   "description": `Seleccioná un ambiente <@${userId}>`,
//                   "color": 0x1eff00,
//                   "timestamp": getTimeStamp(),
//                   "footer": {
//                     "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
//                   }
//                 }
//               ]
//             },
//           });
//           break;
          
//       }
      
//       try {
//         await DiscordRequest(endpoint, { method: 'DELETE' });        
//       } catch (err) {
//         console.error('Error sending message:', err);
//       }

//     }    
  
//     if (componentId === 'environment_select') {

//         const selectedOption = data.values[0];
//         const userId = req.body.member.user.id;
//         const options = selectedOption.split("-");
//         // Keep selection
//         setEnvironment(userId, options[1], options[0], '');

//         const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

//         try {
//           // Send results
//           await res.send({
//             type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
//             data: { 
//               content: '',
//               embeds : [
//               {
//                 "type": "rich",
//                 "title": `Entornos`,
//                 "description": `Acá se muestra el estado de cada ambiente <@${userId}>.`,
//                 "color": 0x00FFFF,
//                 "fields": getEnvironmentsInfo(userId),
//                 "footer": {
//                   "text": `Recordá usar "/environments" y luego "LISTAR" para ver disponibilidad.`
//                 }
//               }
//             ]
//             },
//           });
          
//           // Update ephemeral message
//           await DiscordRequest(endpoint, { method: 'DELETE' });
          
          
//         } catch (err) {
//           console.error('Error sending message:', err);
//         }

//       }
    
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
      
      try {
        
        if (action == 'set') {
          
        
          await res.send({
            type: InteractionResponseType.APPLICATION_MODAL,
            data: {
              custom_id: 'popup_|' + action + '|' + environment,
              title: 'Reservando ' + environment.toUpperCase(),
              components: [
                buildInputRow('card','Numero de Card','42'),
                buildInputRow('tester','Quien la va a estar probando ?.','Grace, Mati, Roque, Maqui, Gus, Pablo White ...'),
                buildInputRow('branch','Cual es la rama / funcionalidad','feature/345-algoasdfs'),
              ],
            },
          });
           
          
        } else {
          
            setEnvironment(userId, environment, '', '');
          
            await res.send(getFinal(environment, userId));
          
        }
        
        try {
          // Update ephemeral message
          await DiscordRequest(endpoint, { method: 'DELETE' });          
        } 
        catch (err) {
          console.error('Error sending message:', err);
        }   
          
        
      } catch (err) {
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

        const card = modalValues.split('|')[0];
        const tester = modalValues.split('|')[1];
        const branch = modalValues.split('|')[2];

        const action = modalId.split('|')[1];
        const environment = modalId.split('|')[2];

        setEnvironment(userId, environment, action, card, tester);

        await res.send(getFinal(environment, userId));

      }
    
  }  
  
  // END environments
  
  // commands
  
  function getFinal(environment, userId) {
    
      return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '',
            flags: InteractionResponseFlags.EPHEMERAL,
            "embeds" : getEnvironmentsReserved(environment, userId),
          },
      };
    
  }
  
  function getEmbedEnvironments(userId) {
    
      return {
        "type": "rich",
        "thumbnail": { url : "https://storage.googleapis.com/m-infra.appspot.com/public/res/expertaseguros/20220214-iIMS5r0Obpb7cF67t7sMh5CqZny1-XNF1X-.png" },
        "title": `Entornos`,
        "description": `La disponiblidad de los ambientes es la siguiente, podras reservar todos aquellos que no esten en rojo, a menos que san maratea nos salve`,
        "color": 0x00FFFF,
        "fields": getEnvironmentsInfo(userId),
        "footer" : { "text" : `` },
        "timestamp": getTimeStamp()
      }
  }
  
  function getEmbedEnvironmentsHeader(userId) {
    
      return {
        "type": "rich",
        "thumbnail": { url : "https://storage.googleapis.com/m-infra.appspot.com/public/res/expertaseguros/20220214-iIMS5r0Obpb7cF67t7sMh5CqZny1-XNF1X-.png" },
        "title": `Entornos`,
        "description": `La disponiblidad de los ambientes es la siguiente, podras reservar todos aquellos que no esten en rojo, a menos que san maratea nos salve`,
        "color": 0x00FFFF,
        "timestamp": getTimeStamp()
      }
  }
  
  function getEmbedEnvironmentsItem(env) {
    
      const ICON_NOENV = ':blue_heart:';
      const ICON_ENV = ':heart:';

      if (env.state != 0)
        return {
          "type": "rich",
          "title": `${env.label}                                                            ${ICON_ENV} `,
          "color": 0xc0392b,
          //"description": 'aaaa',
          "fields": [
            {
              "name": ``,
              "value": `Probando: ${env.tester} \nDesde: ${getTimestampFormat(env.timestamp)} \nCard: #${env.card} \n`,
            }
          ],
          
        }
    
        return {
          "type": "rich",
          "title": `${env.label}                                                            ${ICON_NOENV} `,
          "color": 0x00FFFF,
          //"description": 'aaaa',
          "fields": [{"name": `Disponible`, "value": ''}],
        }
    
  }
  
  function getEmbedReserve(environment, userId) {
    
      return {
        "type": "rich",
        "title": `Reserva confirmada`,
        "description": `Gracias <@${userId}> por usar nuestros servicios, `,
        "color": 0x0099ff,
        // "footer" : { "text" : `Gracias <@${userId}> por usar nuestros servicios` },
        "timestamp": getTimeStamp(),
        // "author": {
        //     "name": `<@${userId}>`,
        //     "icon_url": "https://storage.googleapis.com/m-infra.appspot.com/public/res/expertaseguros/20220214-iIMS5r0Obpb7cF67t7sMh5CqZny1-XNF1X-.png"
        // },
      }
  }
  
  //wrapper para la nueva version
  function getEnvironmentsList(userId) {
    
    //legacy
    return [getEmbedEnvironments(userId)];
    
    // let items = getRPSEnvironments().map((element) => getEmbedEnvironmentsItem(element));
    // return [
    //    getEmbedEnvironmentsHeader(userId),
    //   ...items
    // ];
    
  }
  
  function getEnvironmentsReserved(environment, userId) {
    
    return [
      getEmbedEnvironments(userId),
      getEmbedReserve(environment, userId)
    ];
    
  }
  
  // buttons
  function getEnvironmentsActions() {
    
    // por cada ambiente disponible
    // damos la posibilidad de reservar
    const isRelease = (state) => (state == 0) ? 'set' : 'release';
    // identificamos con el style si puede o no
    const style = (state) => (state == 0) ? ButtonStyleTypes.PRIMARY : ButtonStyleTypes.DANGER;
    
    const buttons = (e) => {
      
      return {
          type: MessageComponentTypes.BUTTON,
          custom_id: `environment_action|${isRelease(e.state)}|${e.value}|${req.body.id}`,
          label: `${e.label}`,
          style: style(e.state),
      }
      
    }
    
    return getRPSEnvironments().map(buttons);
    
  }
  
  function getEnvironmentsInfo(UserId) {

    return getRPSEnvironments().map((element) => getEnvironmentState(element));
    
  }
  
  // item state
  function getEnvironmentState(env) {
    
    const ICON_NOENV = ':blue_heart:';
    const ICON_ENV = ':heart:';

    if (env.state != 0)
      return {
          "name": `${ICON_ENV}   ${env.label} `,
          "value": `*Probando*: ${env.tester} \n*Desde*: ${getTimestampFormat(env.timestamp)} \n*Card*: #${env.card} \n`,
        }

    return {
      "name": `${ICON_NOENV}  ${env.label}`,
      "value": '*Disponible*',
    };
 
  }
  
  
  // END commands
  
  // TODO poner todo esto en utils
  

  function getTimestampFormat (timestamp) {
    
    return new Date(timestamp).toUTCString().replace( / GMT$/, "" );
    
  }

  function buildInputRow(custom_id, label, placeholder) {
    {
        return {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.INPUT_TEXT,
                custom_id: custom_id,
                style: 1,
                label: label,                    
                placeholder: placeholder,
              },
            ],
          }
        }
  }
  

  function getTimeStamp(){
    
      const now = new Date();
      const offset = -3 * 3600 * 1000; //now.getTimezoneOffset();
      const timestamp = new Date(now.getTime() + offset); //let d = new Date(new Date().toLocaleString("en-US", {timeZone: "timezone id"}));
      
      console.log("timestamp:",timestamp);
      return timestamp;
  }
  
  function setEnvironment(userId, env, task, card, tester) {
    
    console.log('teser',tester);
      
    let environment = getRPSEnvironments().filter(e => e.value == env);
    let update = { ...environment[0], 
      id:0,
      card:'',
      state: 0,
      timestamp:'',
      tester: '',
    };
    
    if (task == 'release') {
      delete environments[env];        
    }

    if (task == 'set') {    

      environments[env] = {
        id: userId,
        timestamp: getTimeStamp(),
        task, 
        card
      };  

      update = { ...environment[0], 
        id:userId,
        card:card,
        state: 1,
        tester: tester,
        timestamp:getTimeStamp()
      };


    }   

    setRPSEnvironments(env, update);

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
  console.log('Checking Guild Commands');
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