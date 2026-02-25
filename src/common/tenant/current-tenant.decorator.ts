import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TenantContext } from './tenant.types';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext | null => {
    const req = ctx.switchToHttp().getRequest();
    return ((req as any).tenant as TenantContext | null) || null;
  },
);
