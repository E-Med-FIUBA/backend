import { Controller, Delete, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req) {
    return req.user;
  }

  @Delete('all')
  async deleteAll(@Query('apiKey') apiKey: string) {
    if (!process.env.DELETE_API_KEY || process.env.DELETE_API_KEY !== apiKey) {
      return { error: 'Invalid API' }
    }

    return this.usersService.deleteAll();
  }
}
