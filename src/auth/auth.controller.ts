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
  registerDoctor(
    @Body() doctor: DoctorRegisterDTO,
  ): Promise<{ token: string }> {
    return this.authService.registerDoctor(doctor);
  }

  @Post('register/pharmacist')
  registerPharmacist(
    @Body() pharmacist: PharmacistRegisterDTO,
  ): Promise<{ token: string }> {
    return this.authService.registerPharmacist(pharmacist);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() loginInfo: LoginDTO): Promise<{ token: string }> {
    return this.authService.login(loginInfo);
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
