import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { firebaseAdmin } from '../firebase/firebase';
import { UsersService } from '../models/users/users.service';

const logger = new Logger();

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private usersService: UsersService) { }

  public async canActivate(ctx: ExecutionContext): Promise<boolean> | never {
    const request = ctx.switchToHttp().getRequest();
    let decodedToken: DecodedIdToken;
    try {
      const token = request.headers.authorization.split(' ')[1];
      decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      logger.log('token: ', token);

      const user = await this.usersService.findByUIDIncludeData(
        decodedToken.uid,
      );
      request.user = user;
      return true;
    } catch (err) {
      logger.error(`Error verifying token: ${err}`);
      throw new UnauthorizedException({
        message: 'Invalid token',
      });
    }
  }
}
