import { LoggerFactory } from '@fiu-fit/common';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { firebaseAdmin } from '../../firebase/firebase';

const logger = LoggerFactory('AuthGuard');

@Injectable()
export class AuthGuard implements CanActivate {
  public async canActivate(ctx: ExecutionContext): Promise<boolean> | never {
    const request = ctx.switchToHttp().getRequest();
    let decodedToken: DecodedIdToken;
    try {
      const token = request.headers.authorization.split(' ')[1];
      decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      logger.info('token: ', decodedToken);
      request.user = decodedToken;
      return true;
    } catch (err) {
      logger.info(`Error verifying token: ${err}`);
      throw new UnauthorizedException({
        message: 'Invalid token',
      });
    }
  }
}
