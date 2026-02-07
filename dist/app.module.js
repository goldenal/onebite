"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const config_module_1 = require("./config/config.module");
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./modules/health/health.module");
const menu_module_1 = require("./modules/menu/menu.module");
const settings_module_1 = require("./modules/settings/settings.module");
const auth_module_1 = require("./modules/auth/auth.module");
const staff_module_1 = require("./modules/staff/staff.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const reservations_module_1 = require("./modules/reservations/reservations.module");
const promotions_module_1 = require("./modules/promotions/promotions.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const group_orders_module_1 = require("./modules/group-orders/group-orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const delivery_module_1 = require("./modules/delivery/delivery.module");
const legacy_orders_module_1 = require("./modules/legacy-orders/legacy-orders.module");
const kitchen_module_1 = require("./modules/kitchen/kitchen.module");
const agent_module_1 = require("./modules/agent/agent.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const tablet_module_1 = require("./modules/tablet/tablet.module");
const chat_module_1 = require("./modules/chat/chat.module");
const voice_module_1 = require("./modules/voice/voice.module");
const locations_module_1 = require("./modules/locations/locations.module");
const log_body_interceptor_1 = require("./common/interceptors/log-body.interceptor");
const core_1 = require("@nestjs/core");
const prettyTarget = (() => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require.resolve('pino-pretty');
    }
    catch {
        return null;
    }
})();
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            prisma_module_1.PrismaModule,
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'info'),
                    redact: ['req.headers.authorization', 'req.headers.cookie'],
                    autoLogging: false,
                    transport: process.env.LOG_PRETTY === 'true' || process.env.NODE_ENV !== 'production'
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
            health_module_1.HealthModule,
            menu_module_1.MenuModule,
            settings_module_1.SettingsModule,
            auth_module_1.AuthModule,
            staff_module_1.StaffModule,
            inventory_module_1.InventoryModule,
            reservations_module_1.ReservationsModule,
            promotions_module_1.PromotionsModule,
            reviews_module_1.ReviewsModule,
            group_orders_module_1.GroupOrdersModule,
            payments_module_1.PaymentsModule,
            delivery_module_1.DeliveryModule,
            locations_module_1.LocationsModule,
            legacy_orders_module_1.LegacyOrdersModule,
            kitchen_module_1.KitchenModule,
            agent_module_1.AgentModule,
            webhooks_module_1.WebhooksModule,
            tablet_module_1.TabletModule,
            chat_module_1.ChatModule,
            voice_module_1.VoiceModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: log_body_interceptor_1.LogBodyInterceptor,
            },
        ],
    })
], AppModule);
