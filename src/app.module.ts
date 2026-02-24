import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { MenuModule } from './modules/menu/menu.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { GroupOrdersModule } from './modules/group-orders/group-orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { LegacyOrdersModule } from './modules/legacy-orders/legacy-orders.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { AgentModule } from './modules/agent/agent.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { TabletModule } from './modules/tablet/tablet.module';
import { ChatModule } from './modules/chat/chat.module';
import { VoiceModule } from './modules/voice/voice.module';
import { LocationsModule } from './modules/locations/locations.module';
import { LogBodyInterceptor } from './common/interceptors/log-body.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantModule } from './common/tenant/tenant.module';
import { TenantMiddleware } from './common/tenant/tenant.middleware';
import { PublicModule } from './modules/public/public.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PlatformModule } from './modules/platform/platform.module';

const prettyTarget = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require.resolve('pino-pretty');
  } catch {
    return null;
  }
})();

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    TenantModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'info'),
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: false,
        transport:
          process.env.LOG_PRETTY === 'true' || process.env.NODE_ENV !== 'production'
            ? prettyTarget
              ? {
                  target: prettyTarget,
                  options: {
                    colorize: true,
                    singleLine: false,
                    levelFirst: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined
            : undefined,
        serializers: {
          req(req) {
            return { method: req.method, url: req.url };
          },
          res(res) {
            return { statusCode: res.statusCode };
          },
        },
      },
    }),
    HealthModule,
    MenuModule,
    SettingsModule,
    AuthModule,
    InventoryModule,
    ReservationsModule,
    PromotionsModule,
    ReviewsModule,
    GroupOrdersModule,
    PaymentsModule,
    DeliveryModule,
    LocationsModule,
    LegacyOrdersModule,
    KitchenModule,
    AgentModule,
    WebhooksModule,
    TabletModule,
    ChatModule,
    VoiceModule,
    PublicModule,
    CustomersModule,
    PlatformModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LogBodyInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
