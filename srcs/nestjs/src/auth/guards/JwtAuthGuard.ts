import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

//intercept the request, grabing it from context, and checking if it is authenticated
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
}