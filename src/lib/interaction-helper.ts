import { EmbedBuilder } from 'discord.js';

export function buildLovenseQrCodeEmbed(link: string) {
  const embedBuilder = new EmbedBuilder();
  embedBuilder.setTitle('Link your Lovense account');
  embedBuilder.setDescription(
    'Please link your Lovense account with the lovense Connect or Remote App, using this qr code:',
  );
  embedBuilder.setImage(link);
  embedBuilder.setFooter({
    text: 'If you have any questions, please contact us on Discord or via email',
  });
  return embedBuilder;
}
