import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { KitchenModule } from '../kitchen/kitchen.module';

@Module({
  imports: [KitchenModule],
  controllers: [AgentController],
})
export class AgentModule {}
