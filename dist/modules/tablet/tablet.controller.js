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
exports.TabletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tablet_service_1 = require("./tablet.service");
let TabletController = class TabletController {
    constructor(tablet) {
        this.tablet = tablet;
    }
    async activity(body) {
        const result = await this.tablet.touchSession({ tabletId: body.tabletId.trim() });
        return {
            sessionId: result.session.sessionId,
            tabletId: result.session.tabletId,
            questionCount: Number(result.session.questionCount || 0),
            remainingQuestions: result.remainingQuestions,
            orderStatus: result.session.orderStatus,
            warningSent: result.session.warningSent,
            showPreTimeoutWarning: result.showPreTimeoutWarning,
            sessionReset: result.sessionReset,
            clearCart: result.clearCart,
            locked: result.locked,
        };
    } //
    async orderStatus(body) {
        const status = this.tablet.normalizeOrderStatus(body.orderStatus);
        if (!status)
            throw new common_1.BadRequestException('invalid_order_status');
        const result = await this.tablet.touchSession({
            tabletId: body.tabletId.trim(),
            orderStatusOverride: status,
        });
        return {
            sessionId: result.session.sessionId,
            tabletId: result.session.tabletId,
            questionCount: Number(result.session.questionCount || 0),
            remainingQuestions: result.remainingQuestions,
            orderStatus: result.session.orderStatus,
            warningSent: result.session.warningSent,
            showPreTimeoutWarning: result.showPreTimeoutWarning,
            sessionReset: result.sessionReset,
            clearCart: result.clearCart,
            locked: result.locked,
        };
    }
};
exports.TabletController = TabletController;
__decorate([
    (0, common_1.Post)('activity'),
    (0, swagger_1.ApiBody)({ schema: { example: { tabletId: 'tab_1', sessionId: 'sess_1', activityType: 'menu_view' } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TabletController.prototype, "activity", null);
__decorate([
    (0, common_1.Post)('order-status'),
    (0, swagger_1.ApiBody)({ schema: { example: { tabletId: 'tab_1', sessionId: 'sess_1', orderStatus: 'submitted' } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TabletController.prototype, "orderStatus", null);
exports.TabletController = TabletController = __decorate([
    (0, swagger_1.ApiTags)('tablet'),
    (0, common_1.Controller)('tablet'),
    __metadata("design:paramtypes", [tablet_service_1.TabletService])
], TabletController);
