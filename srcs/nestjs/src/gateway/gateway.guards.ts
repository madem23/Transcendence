import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WebSocketUserGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const client = context.switchToWs().getClient();
		if (!client.data.user) {
			// If user is not defined in socket.data, reject the event
			throw new WsException('Unauthorized: User not authenticated.');
		}
		return true; // User is authenticated
	}
}
