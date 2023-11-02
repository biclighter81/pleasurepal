export const LOVENSE_HEARTBEAT_INTERVAL = 10000;

export function capatializeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function genShortUUID(length: number = 8) {
  let firstPart = (Math.random() * 46656) | 0;
  let secondPart = (Math.random() * 46656) | 0;
  const firstPartStr = ('000' + firstPart.toString(36)).slice(-3);
  const secondPartStr = ('000' + secondPart.toString(36)).slice(-3);
  return firstPartStr + secondPartStr;
}
