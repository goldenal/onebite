import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard, KitchenAccessGuard, OptionalAuthGuard } from './auth.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, KitchenAccessGuard, OptionalAuthGuard],
  exports: [AuthService, AuthGuard, KitchenAccessGuard, OptionalAuthGuard],
})
export class AuthModule {}
