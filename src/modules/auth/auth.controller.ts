import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard, AdminGuard, KitchenGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('admin/login')
  async adminLogin(@Body() body: LoginDto) {
    const user = await this.auth.loginWithRole('admin', body.username, body.password, body.tenantId);
    const token = this.auth.signToken({
      sub: user.id,
      username: user.username,
      role: 'admin',
      tenantId: user.tenantId,
      locationIds: user.locationIds,
    });
    return { success: true, username: user.username, role: 'admin', tenantId: user.tenantId, token, message: 'Login successful' };
  }

  @Post('kitchen/login')
  async kitchenLogin(@Body() body: LoginDto) {
    const user = await this.auth.loginWithRole('kitchen', body.username, body.password, body.tenantId);
    const token = this.auth.signToken({
      sub: user.id,
      username: user.username,
      role: 'kitchen',
      tenantId: user.tenantId,
      locationIds: user.locationIds,
    });
    return { success: true, username: user.username, role: 'kitchen', tenantId: user.tenantId, token, message: 'Login successful' };
  }

  @Get('admin/verify')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  adminVerify(@Res() res: Response) {
    res.json({ valid: true });
  }

  @Get('kitchen/verify')
  @UseGuards(AuthGuard, KitchenGuard())
  @ApiBearerAuth('bearer')
  kitchenVerify(@Res() res: Response) {
    res.json({ valid: true });
  }

  @Post('logout')
  logout() {
    return { success: true, message: 'Logged out' };
  }
}
