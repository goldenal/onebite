import { Body, Controller, Get, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { getBearerToken, signStaffToken, verifyStaffToken } from '../auth/auth.util';
import { createErrorEnvelope } from '../../common/errors/error-response';

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('access')
  @ApiBody({ schema: { example: { code: '123456' } } })
  access(@Body() body: { code: string }) {
    const portalCode = this.auth.getStaffPortalCode();
    if (!portalCode) throw new UnauthorizedException('staff_code_not_configured');
    if (!body?.code || body.code !== portalCode) throw new UnauthorizedException('invalid_code');

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new UnauthorizedException('JWT_SECRET is required');

    const token = signStaffToken(secret, this.config.get('AUTH_TOKEN_TTL') || '24h');
    return { success: true, token };
  }

  @Get('verify')
  @ApiBearerAuth('bearer')
  verify(@Req() req: Request, @Res() res: Response) {
    const portalCode = this.auth.getStaffPortalCode();
    if (!portalCode) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorEnvelope({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'staff_code_not_configured',
            path: req.url,
          }),
        );
    }

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorEnvelope({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'jwt_secret_required',
            path: req.url,
          }),
        );
    }

    const token = getBearerToken(req);
    if (!token) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(createErrorEnvelope({ statusCode: HttpStatus.UNAUTHORIZED, code: 'unauthorized', path: req.url }));
    }

    try {
      const ok = verifyStaffToken(token, secret);
      if (!ok) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json(createErrorEnvelope({ statusCode: HttpStatus.UNAUTHORIZED, code: 'unauthorized', path: req.url }));
      }
      return res.json({ ok: true });
    } catch {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(createErrorEnvelope({ statusCode: HttpStatus.UNAUTHORIZED, code: 'unauthorized', path: req.url }));
    }
  }

  @Post('logout')
  logout() {
    return { success: true };
  }
}
