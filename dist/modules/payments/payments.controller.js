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
let PaymentsController = class PaymentsController {
    constructor(payments) {
        this.payments = payments;
    }
    async createCart(body) {
        return this.payments.createCart(body);
    }
    async paymentLink(body) {
        return this.payments.createPaymentLink(body);
    }
    async getPayment(orderId) {
        return this.payments.getPayment(orderId);
    }
    async phonePaymentLink(body) {
        return this.payments.phonePaymentLink(body);
    }
    async createCheckoutSession(body) {
        return this.payments.createCheckoutSession(body);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('cart/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cart_create_dto_1.CartCreateDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createCart", null);
__decorate([
    (0, common_1.Post)('payments/link'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_link_dto_1.PaymentLinkDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "paymentLink", null);
__decorate([
    (0, common_1.Get)('payments/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPayment", null);
__decorate([
    (0, common_1.Post)('phone/payment-link'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [phone_payment_link_dto_1.PhonePaymentLinkDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "phonePaymentLink", null);
__decorate([
    (0, common_1.Post)('payments/checkout-session'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkout_session_dto_1.CheckoutSessionDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createCheckoutSession", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
