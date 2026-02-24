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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const cart_create_dto_1 = require("./dto/cart-create.dto");
const payment_link_dto_1 = require("./dto/payment-link.dto");
const phone_payment_link_dto_1 = require("./dto/phone-payment-link.dto");
const checkout_session_dto_1 = require("./dto/checkout-session.dto");
const tenant_required_guard_1 = require("../../common/tenant/tenant-required.guard");
const current_tenant_decorator_1 = require("../../common/tenant/current-tenant.decorator");
const auth_guard_1 = require("../auth/auth.guard");
const platform_service_1 = require("../platform/platform.service");
let PaymentsController = class PaymentsController {
    constructor(payments, platform) {
        this.payments = payments;
        this.platform = platform;
    }
    async createCart(tenant, body) {
        return this.payments.createCart(tenant.id, body);
    }
    async paymentLink(tenant, body) {
        return this.payments.createPaymentLink(tenant.id, body);
    }
    async phonePaymentLink(tenant, body) {
        return this.payments.phonePaymentLink(tenant.id, body);
    }
    async createCheckoutSession(tenant, body) {
        return this.payments.createCheckoutSession(tenant.id, body);
    }
    async paymentSummary(tenant, from, to) {
        return this.payments.paymentSummary(tenant.id, {
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    }
    async paymentTransactions(tenant, state, from, to, page, limit) {
        return this.payments.paymentTransactions(tenant.id, {
            state,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
    }
    async connectAccount(tenant) {
        return this.platform.createConnectAccount(tenant.id);
    }
    async connectStatus(tenant) {
        return this.platform.connectStatus(tenant.id);
    }
    async getPayment(tenant, orderId) {
        return this.payments.getPayment(tenant.id, orderId);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('cart/create'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cart_create_dto_1.CartCreateDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createCart", null);
__decorate([
    (0, common_1.Post)('payments/link'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_link_dto_1.PaymentLinkDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "paymentLink", null);
__decorate([
    (0, common_1.Post)('phone/payment-link'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, phone_payment_link_dto_1.PhonePaymentLinkDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "phonePaymentLink", null);
__decorate([
    (0, common_1.Post)('payments/checkout-session'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, checkout_session_dto_1.CheckoutSessionDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createCheckoutSession", null);
__decorate([
    (0, common_1.Get)('payments/summary'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "paymentSummary", null);
__decorate([
    (0, common_1.Get)('payments/transactions'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "paymentTransactions", null);
__decorate([
    (0, common_1.Post)('payments/connect-account'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "connectAccount", null);
__decorate([
    (0, common_1.Get)('payments/connect-status'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "connectStatus", null);
__decorate([
    (0, common_1.Get)('payments/:orderId'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPayment", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(tenant_required_guard_1.TenantRequiredGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        platform_service_1.PlatformService])
], PaymentsController);
