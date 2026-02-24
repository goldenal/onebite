import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenants: TenantService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantHeader = req.headers['x-tenant-id'];
    const tenantId = typeof tenantHeader === 'string' ? tenantHeader : null;

    const tenant = await this.tenants.resolveById(tenantId);
    (req as any).tenant = tenant;

    next();
  }
}
