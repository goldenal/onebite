import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StaffController],
})
export class StaffModule {}
