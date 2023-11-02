//Discord Reply constants
export const NEED_TO_REGISTER_PLEASUREPAL =
  'Before you can link your Lovense account, you need to register at pleasurepal! Please register under https://pleasurepal.de - [http://localhost:3000]. After registering you can link your discord account!';
export const LOVENSE_ACCOUNT_ALREADY_LINKED =
  'Your Lovense account is already linked! New devices will be added automatically. If your new devices will not show up, you can try to relink your account!';
export const LOVENSE_QR_CODE_GENERATION_ERROR =
  'An error occured while trying to get the Lovense link QR Code! Please try again later!';
export const LOVENSE_ACCOUNT_NOT_LINKED =
  'Your Lovense account is not linked! Plesae link your account with the /link command!';
export const LOVENSE_ACCOUNT_ALREADY_UNLINKED =
  'Your Lovense account is already unlinked!';
export const LOVENSE_ACCOUNT_UNLINKED = 'Your Lovense account is now unlinked!';
export const INVITED_NO_ACCOUNT = (initiator: string) => {
  return `You have been invited to a pleasurepal session by \`@${initiator}\`, but you have not linked your discord account with your pleasurepal account or worse: You maybe don't even have a pleasurepal account! Please register under https://pleasurepal.de/ and link your discord account under https://pleasurepal.de/profile.`;
};
export const INVITED_NOT_LINKED = (initiator: string) => {
  return `You have been invited to a pleasurepal session by \`@${initiator}\`, but it seems like you didn't open the lovense remote app yet! Please open the app and link your account!`;
};
