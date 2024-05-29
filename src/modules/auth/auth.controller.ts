import { HttpService } from '@nestjs/axios';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Injectable,
  Post,
} from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { axiosErrorCatcher } from '../../shared/axios-error-catcher';
import {
  LoginRequest,
  RegisterRequest,
  Token,
} from './interfaces/auth.interface';

@Injectable()
@Controller('auth')
export class AuthController {
  constructor(private httpService: HttpService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginRequest: LoginRequest): Promise<Token> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<Token>('auth/login', loginRequest)
        .pipe(catchError(axiosErrorCatcher))
    );
    return data;
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginRequest: LoginRequest): Promise<Token> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<Token>('auth/admin/login', loginRequest)
        .pipe(catchError(axiosErrorCatcher))
    );
    return data;
  }

  @Post('register')
  async register(@Body() newUser: RegisterRequest): Promise<Token> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<Token>('auth/register', newUser)
        .pipe(catchError(axiosErrorCatcher))
    );
    return data;
  }

  @Post('admin/register')
  async adminRegister(
    @Headers('Authorization') authToken: string,
    @Body() newUser: RegisterRequest
  ): Promise<Token> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<Token>('auth/admin/register', newUser, {
          headers: { Authorization: authToken },
        })
        .pipe(catchError(axiosErrorCatcher))
    );
    return data;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<Token> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<Token>('auth/logout')
        .pipe(catchError(axiosErrorCatcher))
    );
    return data;
  }

  @Post('password-reset')
  async passwordReset(@Headers('Authorization') bearerToken: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .post<Token>('auth/password-reset', null, {
          headers: { Authorization: bearerToken },
        })
        .pipe(catchError(axiosErrorCatcher))
    );
    return data;
  }
}
