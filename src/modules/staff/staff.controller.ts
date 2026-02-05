import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { getBearerToken, signStaffToken, verifyStaffToken } from '../auth/auth.util';

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('access')
  access(@Body() body: { code: string }) {
    const portalCode = this.auth.getStaffPortalCode();
    if (!portalCode) throw new UnauthorizedException('staff_code_not_configured');
    if (!body?.code || body.code !== portalCode) throw new UnauthorizedException('invalid_code');

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new UnauthorizedException('JWT_SECRET is required');

    const token = signStaffToken(secret, this.auth.getStaffCookieMaxAge());
    return { success: true, token };
  }

  @Get('verify')
  verify(@Req() req: Request, @Res() res: Response) {
    const portalCode = this.auth.getStaffPortalCode();
    if (!portalCode) return res.status(500).json({ ok: false });

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) return res.status(500).json({ ok: false });

    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false });

    try {
      const ok = verifyStaffToken(token, secret);
      if (!ok) return res.status(401).json({ ok: false });
      return res.json({ ok: true });
    } catch {
      return res.status(401).json({ ok: false });
    }
  }

  @Post('logout')
  logout() {
    return { success: true };
  }
}
