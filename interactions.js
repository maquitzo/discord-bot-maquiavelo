import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";

import {
  VerifyDiscordRequest,
  getRandomEmoji,
  DiscordRequest,
} from "./utils.js";

import { 
  getShuffledOptions, 
  getResult, 
  initiliazeDB,
  getRPSEnvironments, 
  setRPSEnvironments,
  setRPSEnvironmentsAsync
} from './game.js';

export function getInteractionMaquitzo() {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      // Fetches a random emoji to send from a helper function
      content: "",
      embeds: [
        {
          type: "rich",
          title: `Hice este lindo emoji ${getRandomEmoji()} pensando en vos ... `,
          description: ``,
          color: 0x00ffff,
          footer: {
            text: `(es mentira lo busque en fontawesome, copy paste, pero la intencion es lo que vale)`,
          },
        },
      ],
    },
  };
}

export function getInteractionEnvironment(userId, db, interactionId) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      //content: content,
      flags: InteractionResponseFlags.EPHEMERAL,
      components: [
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: getEnvironmentsActions(db, interactionId),
        },
      ],
      embeds: [getEmbedEnvironments(userId, db)],
    },
  };
}

export function getInteractionIndependiente(userId) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: "",
      embeds: [
        {
          type: "rich",
          title: `No es por ahí rey !!! !!! `,
          description: `Mi corazonzito tiene otros colores`,
          color: 0x0099ff,
          image: {
            url: getGiphy(),
            height: null,
            width: null,
          },
        },
      ],
    },
  };
}

export function getInteractionTincho(userId) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: "",
      components: [
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.STRING_SELECT,
              custom_id: "tincho_options_environment_select",
              placeholder: "Haz una selección",
              options: [
                {
                  label: "RESERVAR",
                  value: "set",
                  description:
                    "Reserválo con pesos, si lo liberáss en un rato te devuelvo la guita",
                },
                {
                  label: "LIBERAR",
                  value: "release",
                  description: "FreeWilly pero con el ambiente",
                },
              ],
            },
          ],
        },
      ],
      embeds: [
        {
          type: "rich",
          title: `Disponibilidad de entornos`,
          description: `El estado de disponibilidad de cada uno`,
          color: 0x00ffff,
          fields: getEnvironmentsInfo(userId),
          footer: {
            text: `Recordá usar "/environments" para ver disponibilidad.`,
          },
        },
      ],
    },
  };
}

export function getInteractionFinal(environment, userId) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: "",
      flags: InteractionResponseFlags.EPHEMERAL,
      embeds: getEnvironmentsReserved(environment, userId),
    },
  };
}

//COMMANDS

export function getInteractionEnvironmentCommand(action, environment) {
  return {
    type: InteractionResponseType.APPLICATION_MODAL,
    data: {
      custom_id: "popup_|" + action + "|" + environment,
      title: "Reservando " + environment.toUpperCase(),
      components: [
        buildInputRow("card", "Numero de Card", "42"),
        buildInputRow(
          "tester",
          "Quien la va a estar probando ?.",
          "Grace, Mati, Roque, Maqui, Gus, Pablo White ..."
        ),
        buildInputRow(
          "branch",
          "Cual es la rama / funcionalidad",
          "feature/345-algoasdfs"
        ),
      ],
    },
  };
}

// DB
export function setEnvironment(action, environment, db) {

  const update = (action == "set") ?
    {
      ...environment,
      state: 1,
      timestamp: getTimeStamp(),
    }
  :
    {
      ...environment,
      card: "",
      state: 0,
      timestamp: "",
      user: {
        tester: "",
        dev: "",
      },
      timestamp: getTimeStamp(),
    }

  return setRPSEnvironmentsAsync(environment.name, update, db);
  
}


// helpers ============================================



// function getEmbedHeader(userId) {
//   return {
//     type: "rich",
//     thumbnail: {
//       url: "https://storage.googleapis.com/m-infra.appspot.com/public/res/expertaseguros/20220214-iIMS5r0Obpb7cF67t7sMh5CqZny1-XNF1X-.png",
//     },
//     title: `Entornos`,
//     description: `La disponiblidad de los ambientes es la siguiente, podras reservar todos aquellos que no esten en rojo, a menos que san maratea nos salve`,
//     color: 0x00ffff,
//     timestamp: getTimeStamp(),
//   };
// }

///
/// Body de los estados de los environments
///
function getEmbedEnvironments(userId, db) {
  
  return {
    type: "rich",
    thumbnail: {
      url: "https://storage.googleapis.com/m-infra.appspot.com/public/res/expertaseguros/20220214-iIMS5r0Obpb7cF67t7sMh5CqZny1-XNF1X-.png",
    },
    title: `Entornos`,
    description: `La disponiblidad de los ambientes es la siguiente, podras reservar todos aquellos que no esten en rojo, a menos que san maratea nos salve`,
    color: 0x00ffff,
    fields: getRPSEnvironments(db).map((element) => getField(element)),
    footer: { text: `` },
    timestamp: getTimeStamp(),
  };

}

///
/// Body de los el mensaje de reserva realizado
///
function getEmbedReserve(environment, userId) {
  return {
    type: "rich",
    title: `Reserva de **${environment.name}**`,
    description: `Gracias <@${userId}> por usar nuestros servicios`,
    color: 0x0099ff,
    // "footer" : { "text" : `Gracias <@${userId}> por usar nuestros servicios` },
    timestamp: getTimeStamp(),
    // "author": {
    //     "name": `<@${userId}>`,
    //     "icon_url": "https://storage.googleapis.com/m-infra.appspot.com/public/res/expertaseguros/20220214-iIMS5r0Obpb7cF67t7sMh5CqZny1-XNF1X-.png"
    // },
  };
}

function getEnvironmentsReserved(environment, userId) {
  return [
    getEmbedEnvironments(userId), 
    getEmbedReserve(environment, userId)
  ];
}

// buttons
function getEnvironmentsActions(db, interactionid) {
  
  const isRelease = (state) => (state == 0 ? "set" : "release");
  const style = (state) => state == 0 ? ButtonStyleTypes.PRIMARY : ButtonStyleTypes.DANGER;

  const buttons = (e) => {
    return {
      type: MessageComponentTypes.BUTTON,
      custom_id: `environment_action|${isRelease(e.state)}|${e.name}|${interactionid}`,
      label: `${e.label}`,
      style: style(e.state),
    };
  };

  return getRPSEnvironments(db).map(buttons);
}

// function getEnvironmentsInfo(UserId, db) {
//   return getRPSEnvironments(db).map((element) => getField(element));
// }

//
// Field, valores separados por :
//
function getField(env) {
  //console.log('draw', env);
  const item = (element, value) => `*${element}*: ${value} \n`;
  const naming = () => `${env.state != 0 ? ":heart:" : ":blue_heart:"} ${env.label}`;
  let result = { name: naming(), value: "*Disponible*" };

  if (env.state != 0)
    result = {
      name: naming(),
      value: `${item("Probando", env.user.tester)} ${item("Desde",env.timestamp)} ${item("Branch", env.branch)} ${item("Card", env.card)} ${item("frontend",env.url.frontend)}`,
    };

  return result;
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
    };
  }
}

function getTimeStamp() {
  // const now = new Date();
  // const offset = -3 * 3600 * 1000; 
  // const timestamp = new Date(now.getTime() + offset); 

  //console.log("timestamp:",timestamp);
  return new Date().toISOString();
}

function getTimestampFormat(timestamp) {
  return new Date(timestamp).toUTCString().replace(/ GMT$/, "");
}

function getGiphy() {
  const gifs = [
    "https://assets.goal.com/v3/assets/bltcc7a7ffd2fbf71f5/blt0bf817df67665b1d/60dd2709fd14d30f3eb31356/09707a11ec4943062b5446f04ebe7a3a4959c2c9.jpg?auto=webp&fit=crop&format=jpg&height=800&quality=60&width=1200",
    "https://pm1.narvii.com/6617/90112fae9b68e6c7dbee4768ab23998099e3d2e7_hq.jpg",
    "https://www.ole.com.ar/images/2022/04/02/Jbg5N_LoQ_340x340__1.jpg",
    "https://media.tycsports.com/files/2021/08/24/323286/estadio-racing-cilindro_862x485.jpg",
  ];

  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

  return randomGif;
}
