import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { AuthGuard, AdminGuard, KitchenGuard } from './auth.guard';
import { clearCookie, setCookie } from './auth.util';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('admin/login')
  async adminLogin(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.loginWithRole('admin', body.username, body.password);
    const token = this.auth.signToken({ username: user.username, role: 'admin' });
    setCookie(res, this.auth.getAuthCookieName(), token, {
      maxAge: this.auth.getAuthCookieMaxAge(),
      sameSite: this.auth.getCookieSameSite(),
      secure: this.auth.getCookieSecure(),
      domain: this.auth.getCookieDomain() || undefined,
    });
    return { success: true, username: user.username, role: 'admin', token, message: 'Login successful' };
  }

  @Post('kitchen/login')
  async kitchenLogin(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.loginWithRole('kitchen', body.username, body.password);
    const token = this.auth.signToken({ username: user.username, role: 'kitchen' });
    setCookie(res, this.auth.getAuthCookieName(), token, {
      maxAge: this.auth.getAuthCookieMaxAge(),
      sameSite: this.auth.getCookieSameSite(),
      secure: this.auth.getCookieSecure(),
      domain: this.auth.getCookieDomain() || undefined,
    });
    return { success: true, username: user.username, role: 'kitchen', token, message: 'Login successful' };
  }

  // Public admin credential creation (dev only). Do not use in production.
  @Post('admin/seed')
  async seedAdmin(@Body() body: CreateStaffDto) {
    const user = await this.auth.createAdminUser(body.username, body.password);
    return { success: true, username: user.username, role: user.role };
  }

  // Public kitchen credential creation (dev only). Do not use in production.
  @Post('kitchen/seed')
  async seedKitchen(@Body() body: CreateStaffDto) {
    const user = await this.auth.createKitchenUser(body.username, body.password);
    return { success: true, username: user.username, role: user.role };
  }

  @Get('admin/verify')
  @UseGuards(AuthGuard, AdminGuard())
  adminVerify(@Res() res: Response) {
    res.json({ valid: true });
  }

  @Get('kitchen/verify')
  @UseGuards(AuthGuard, KitchenGuard())
  kitchenVerify(@Res() res: Response) {
    res.json({ valid: true });
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearCookie(res, this.auth.getAuthCookieName(), {
      sameSite: this.auth.getCookieSameSite(),
      secure: this.auth.getCookieSecure(),
      domain: this.auth.getCookieDomain() || undefined,
    });
    return { success: true, message: 'Logged out' };
  }
}
