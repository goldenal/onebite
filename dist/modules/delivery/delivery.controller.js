"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const delivery_service_1 = require("./delivery.service");
const delivery_request_dto_1 = require("./dto/delivery-request.dto");
const delivery_quote_dto_1 = require("./dto/delivery-quote.dto");
const delivery_webhook_dto_1 = require("./dto/delivery-webhook.dto");
const tenant_required_guard_1 = require("../../common/tenant/tenant-required.guard");
const current_tenant_decorator_1 = require("../../common/tenant/current-tenant.decorator");
let DeliveryController = class DeliveryController {
    constructor(delivery) {
        this.delivery = delivery;
    }
    async request(tenant, body) {
        return this.delivery.request(tenant.id, body);
    }
    async quote(tenant, body) {
        return this.delivery.quote(tenant.id, body);
    }
    async webhook(tenant, body) {
        return this.delivery.webhook(tenant.id, body);
    }
    async status(tenant, orderId) {
        return this.delivery.status(tenant.id, orderId);
    }
};
exports.DeliveryController = DeliveryController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, delivery_request_dto_1.DeliveryRequestDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "request", null);
__decorate([
    (0, common_1.Post)('quote'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, delivery_quote_dto_1.DeliveryQuoteDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "quote", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, delivery_webhook_dto_1.DeliveryWebhookDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "webhook", null);
__decorate([
    (0, common_1.Get)(':orderId/status'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "status", null);
exports.DeliveryController = DeliveryController = __decorate([
    (0, swagger_1.ApiTags)('delivery'),
    (0, common_1.Controller)('delivery'),
    (0, common_1.UseGuards)(tenant_required_guard_1.TenantRequiredGuard),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService])
], DeliveryController);
