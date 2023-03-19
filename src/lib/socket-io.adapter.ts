import { IoAdapter } from '@nestjs/platform-socket.io';
import axios from 'axios';

export default class SocketAuthIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.use(async (socket, next) => {
      const { token } = socket.handshake.auth;
      try {
        const res = await axios.get(
          `https://keycloak.rimraf.de/realms/pleasurepal/protocol/openid-connect/userinfo`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (res.status === 200) {
          socket.handshake.auth = {
            ...socket.handshake.auth,
            ...res.data,
          };
          next();
        } else {
          throw new Error();
        }
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
    return server;
  }
}
