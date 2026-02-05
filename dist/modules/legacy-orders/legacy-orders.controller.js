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
exports.LegacyOrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const legacy_orders_service_1 = require("./legacy-orders.service");
const create_legacy_order_dto_1 = require("./dto/create-legacy-order.dto");
const update_legacy_order_dto_1 = require("./dto/update-legacy-order.dto");
const auth_guard_1 = require("../auth/auth.guard");
let LegacyOrdersController = class LegacyOrdersController {
    constructor(orders) {
        this.orders = orders;
    }
    async list() {
        return this.orders.list();
    }
    async get(id) {
        return this.orders.get(id);
    }
    async create(body) {
        return this.orders.create(body);
    }
    async update(id, body) {
        return this.orders.update(id, body);
    }
    async remove(id) {
        return this.orders.remove(id);
    }
};
exports.LegacyOrdersController = LegacyOrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LegacyOrdersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LegacyOrdersController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_legacy_order_dto_1.CreateLegacyOrderDto]),
    __metadata("design:returntype", Promise)
], LegacyOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_legacy_order_dto_1.UpdateLegacyOrderDto]),
    __metadata("design:returntype", Promise)
], LegacyOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LegacyOrdersController.prototype, "remove", null);
exports.LegacyOrdersController = LegacyOrdersController = __decorate([
    (0, swagger_1.ApiTags)('legacy-orders'),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [legacy_orders_service_1.LegacyOrdersService])
], LegacyOrdersController);
