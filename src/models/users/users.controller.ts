import { Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@Req() req) {
    return req.user;
  }

  @Put('me')
  updateMe(@Req() req) {
    return this.usersService.update(req.user.id, req.body);
  }
}
