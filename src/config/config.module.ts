import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './config.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        const parsed = envSchema.safeParse(env);
        if (!parsed.success) {
          throw new Error(`Config validation error: ${parsed.error.message}`);
        }
        return parsed.data;
      },
    }),
  ],
})
export class ConfigModule {}
