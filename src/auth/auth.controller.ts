import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { ResetPasswordRequest } from './dto/password-reset.dto';
import { PharmacistRegisterDTO } from '../models/pharmacists/dto/pharmacist-register.dto';
import { DoctorRegisterDTO } from '../models/doctors/dto/doctor-register.dto';

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
    return this.authService.registerDoctor(pharmacist);
  }

  @Post('login')
  login(@Body() loginInfo: LoginDTO): Promise<{ token: string }> {
    return this.authService.login(loginInfo);
  }

  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @Post('password-reset')
  async resetPassword(@Body() body: ResetPasswordRequest) {
    await this.authService.resetPassword(body.email);
  }
}
