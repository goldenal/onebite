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
exports.GroupOrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const group_orders_service_1 = require("./group-orders.service");
const create_group_order_dto_1 = require("./dto/create-group-order.dto");
const add_group_item_dto_1 = require("./dto/add-group-item.dto");
const update_group_status_dto_1 = require("./dto/update-group-status.dto");
const auth_guard_1 = require("../auth/auth.guard");
let GroupOrdersController = class GroupOrdersController {
    constructor(groupOrders) {
        this.groupOrders = groupOrders;
    }
    async listAdmin() {
        return this.groupOrders.listAdmin();
    }
    async get(id) {
        return this.groupOrders.get(id);
    }
    async create(body) {
        return this.groupOrders.create(body);
    }
    async addItem(id, body) {
        return this.groupOrders.addItem(id, body);
    }
    async removeItem(id, itemId) {
        return this.groupOrders.removeItem(id, itemId);
    }
    async updateStatus(id, body) {
        return this.groupOrders.updateStatus(id, body);
    }
    async participantItems(id, participantName) {
        return this.groupOrders.participantItems(id, participantName);
    }
};
exports.GroupOrdersController = GroupOrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GroupOrdersController.prototype, "listAdmin", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupOrdersController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_group_order_dto_1.CreateGroupOrderDto]),
    __metadata("design:returntype", Promise)
], GroupOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/items'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_group_item_dto_1.AddGroupItemDto]),
    __metadata("design:returntype", Promise)
], GroupOrdersController.prototype, "addItem", null);
__decorate([
    (0, common_1.Delete)(':id/items/:itemId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupOrdersController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_group_status_dto_1.UpdateGroupStatusDto]),
    __metadata("design:returntype", Promise)
], GroupOrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/participant/:participantName'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('participantName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupOrdersController.prototype, "participantItems", null);
exports.GroupOrdersController = GroupOrdersController = __decorate([
    (0, swagger_1.ApiTags)('group-orders'),
    (0, common_1.Controller)('group-orders'),
    __metadata("design:paramtypes", [group_orders_service_1.GroupOrdersService])
], GroupOrdersController);
