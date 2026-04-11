import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.configService.getOrThrow<string>('app.jwtAccessSecret'),
      });
      await client.join(payload.sub);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('notifications:ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('notifications:pong', { ok: true });
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(userId).emit(event, payload);
  }
}
