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
exports.ArrivalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kitchen_service_1 = require("./kitchen.service");
const current_tenant_decorator_1 = require("../../common/tenant/current-tenant.decorator");
const tenant_required_guard_1 = require("../../common/tenant/tenant-required.guard");
const auth_guard_1 = require("../auth/auth.guard");
let ArrivalsController = class ArrivalsController {
    constructor(kitchen) {
        this.kitchen = kitchen;
    }
    async arrive(tenant, orderId) {
        const updated = await this.kitchen.updateArrival(tenant.id, orderId);
        return { arrival_status: updated?.arrival_status, order_id: orderId };
    }
};
exports.ArrivalsController = ArrivalsController;
__decorate([
    (0, common_1.Post)(':orderId'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ArrivalsController.prototype, "arrive", null);
exports.ArrivalsController = ArrivalsController = __decorate([
    (0, swagger_1.ApiTags)('arrivals'),
    (0, common_1.Controller)('arrivals'),
    (0, common_1.UseGuards)(tenant_required_guard_1.TenantRequiredGuard, auth_guard_1.KitchenAccessGuard),
    __metadata("design:paramtypes", [kitchen_service_1.KitchenService])
], ArrivalsController);
