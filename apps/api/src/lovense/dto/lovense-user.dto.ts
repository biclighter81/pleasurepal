export class LovenseCallback {
  uid: string;
  appVersion: string;
  toys: { [key: string]: Toy };
  wssPort: number;
  httpPort: number;
  wsPort: number;
  appType: string;
  domain: string;
  utoken: string;
  httpsPort: number;
  version: string;
  platform: string;
}

export interface Toy {
  nickName: string;
  name: string;
  id: string;
  status: number;
}
