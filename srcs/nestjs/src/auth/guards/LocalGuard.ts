import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

//overriding standard AuthGuard behaviour for local auth strategy, to get more control
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
}
