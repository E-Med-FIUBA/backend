import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { ResetPasswordRequest } from './dto/password-reset.dto';
import { PharmacistRegisterDTO } from '../models/pharmacists/dto/pharmacist-register.dto';
import { DoctorRegisterDTO } from '../models/doctors/dto/doctor-register.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/doctor')
  async registerDoctor(@Body() doctor: DoctorRegisterDTO) {
    await this.authService.registerDoctor(doctor);
    return {
      message: 'Doctor creation in progress',
    };
  }

  @Post('register/pharmacist')
  registerPharmacist(
    @Body() pharmacist: PharmacistRegisterDTO,
  ): Promise<{ token: string }> {
    return this.authService.registerPharmacist(pharmacist);
  }

  @HttpCode(200)
  @Post('login/pharmacist')
  loginPharmacist(@Body() loginInfo: LoginDTO): Promise<{ token: string }> {
    return this.authService.loginPharmacist(loginInfo);
  }

  @HttpCode(200)
  @Post('login/doctor')
  loginDoctor(@Body() loginInfo: LoginDTO): Promise<{ token: string }> {
    return this.authService.loginDoctor(loginInfo);
  }

  @HttpCode(200)
  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @HttpCode(200)
  @Post('password-reset')
  async resetPassword(@Body() body: ResetPasswordRequest) {
    await this.authService.resetPassword(body.email);
  }
}
