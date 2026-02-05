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
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const kitchen_service_1 = require("../kitchen/kitchen.service");
let AgentController = class AgentController {
    constructor(kitchen) {
        this.kitchen = kitchen;
    }
    async confirmPayment(body) {
        const cartId = body?.cart_id;
        if (!cartId)
            return { error: 'bad_request', message: 'cart_id required' };
        const orderId = `ord_${cartId}`;
        const order = await this.kitchen.getOrder(orderId);
        return { paid: !!order, order_id: order ? order.id : null };
    }
    async generatePickup(body) {
        const orderId = body?.order_id;
        if (!orderId)
            return { error: 'bad_request', message: 'order_id required' };
        return this.kitchen.generatePickup(orderId);
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Post)('confirm_payment'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.Post)('generate_pickup_code'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "generatePickup", null);
exports.AgentController = AgentController = __decorate([
    (0, swagger_1.ApiTags)('agent'),
    (0, common_1.Controller)('agent'),
    __metadata("design:paramtypes", [kitchen_service_1.KitchenService])
], AgentController);
