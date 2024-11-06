import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

// @Injectable()
// //intercept the request, grabing it from context, and checking if it is authenticated
// export class AuthenticatedGuard implements CanActivate {
// 	async canActivate(context: ExecutionContext) {
// 		const req = context.switchToHttp().getRequest<Request>();
// 		return req.isAuthenticated();
// 	}
// }