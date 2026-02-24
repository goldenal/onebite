import { Global, Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantRequiredGuard } from './tenant-required.guard';

@Global()
@Module({
  providers: [TenantService, TenantRequiredGuard],
  exports: [TenantService, TenantRequiredGuard],
})
export class TenantModule {}
