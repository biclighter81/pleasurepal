import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import axios from 'axios';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

export default class SocketAuthIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectRedis() {
    const pubClient = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    })
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
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
