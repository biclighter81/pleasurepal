import {
  APIActionRowComponent,
  BaseMessageOptions,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  ChannelSelectMenuInteraction,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuInteraction,
  User,
  UserSelectMenuInteraction,
} from 'discord.js';
import { User_PleasureSession } from 'src/session/entities/user_plesure_session.join-entity';
type ComponentsType = BaseMessageOptions['components'];
type InteractionTimeoutType =
  | UserSelectMenuInteraction<CacheType>
  | ChannelSelectMenuInteraction<CacheType>
  | StringSelectMenuInteraction<CacheType>
  | ButtonInteraction<CacheType>
  | CommandInteraction;

export function buildLovenseQrCodeEmbed(link: string, title?: string) {
  const embedBuilder = new EmbedBuilder();
  embedBuilder.setTitle(title || 'Link your Lovense account or open the app!');
  embedBuilder.setDescription(
    `Please link your Lovense account with the lovense Connect or Remote App. If you have already linked your account, please open the app! If you don't receive an automated invitation, please scan the QR Code again to relink your account!`,
  );
  embedBuilder.setImage(link);
  embedBuilder.setFooter({
    text: 'If you have any questions, please contact us on Discord or via email',
  });
  return embedBuilder;
}

export function interactionTimeout(
  interaction: InteractionTimeoutType,
  reason: string,
  timeoutMsg: string,
) {
  if (reason === 'time') {
    interaction.editReply({
      content: `${timeoutMsg}`,
      components: [],
      embeds: [],
    });
  }
}

/* Interaction Components */
export const ALREADY_LINKED_COMPONENTS: ComponentsType = [
  {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        style: ButtonStyle.Primary,
        label: 'Try re-linking',
        customId: 'link',
      },
      {
        type: ComponentType.Button,
        style: ButtonStyle.Danger,
        label: 'Unlink account',
        customId: 'unlink',
      },
    ],
  },
  {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        style: ButtonStyle.Secondary,
        label: 'Cancel',
        customId: 'cancel',
      },
    ],
  },
];

export const LEAVE_INTERACTION_CONFIRM_COMPONENTS: ComponentsType = [
  {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        style: ButtonStyle.Danger,
        label: 'Leave',
        customId: 'leave',
      },
      {
        type: ComponentType.Button,
        style: ButtonStyle.Secondary,
        label: 'Stay in session',
        customId: 'cancel',
      },
    ],
  },
];

export const SESSION_CREATION_COMPONENTS: ComponentsType = [
  {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.UserSelect,
        customId: 'users',
        placeholder: 'Select users to invite to your session',
        minValues: 0,
        maxValues: 5,
      },
    ],
  },
  {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.ChannelSelect,
        customId: 'channelSession',
        placeholder: 'Select a channel if you want to start a channel session',
      },
    ],
  },
  {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        customId: 'startSession',
        label: 'Start session',
        style: ButtonStyle.Primary,
      },
      {
        type: ComponentType.Button,
        customId: 'cancelSession',
        label: 'Cancel',
        style: ButtonStyle.Danger,
      },
    ],
  },
];

export const SESSION_INVITATION_COMPONENTS: ComponentsType = [
  {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        customId: 'joinSession',
        label: 'Join Session',
        style: ButtonStyle.Primary,
      },
      {
        type: ComponentType.Button,
        customId: 'declineSession',
        label: 'Decline',
        style: ButtonStyle.Danger,
      },
    ],
  },
];

export const AUTHORIZE_SESSION_USER_SELECT_COMPONENTS = (
  duser: { user: User; kcId: string }[],
) => {
  return [
    {
      type: ComponentType.StringSelect,
      options: [
        ...duser.map((u) => ({
          label: u.user.username,
          value: u.user.id,
        })),
      ],
      customId: 'users',
      placeholder: 'Select users to authorize',
      minValues: 1,
      maxValues: duser.length,
    },
  ] as any;
};

export const AUTHORIZE_SESSION_USER_BUTTON_COMPONENTS: any = {
  type: ComponentType.ActionRow,
  components: [
    {
      type: ComponentType.Button,
      customId: 'authorize',
      label: 'Authorize',
      style: ButtonStyle.Primary,
    },
    {
      type: ComponentType.Button,
      customId: 'cancel',
      label: 'Cancel',
      style: ButtonStyle.Danger,
    },
  ],
};
