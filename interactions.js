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

export function getInteractionEnvironments() {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      //content: content,
      //flags: InteractionResponseFlags.EPHEMERAL,
      components: [
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: getEnvironmentsActions(),
        },
      ],
      embeds: getEnvironmentsList(userId),
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
      };
}

// helpers
