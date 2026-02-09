"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitchenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kitchen_service_1 = require("./kitchen.service");
const auth_guard_1 = require("../auth/auth.guard");
let KitchenController = class KitchenController {
    constructor(kitchen) {
        this.kitchen = kitchen;
    }
    async stream(req, res) {
        res.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });
        res.flushHeaders();
        res.write('retry: 5000\n\n');
        const { streamHub } = await Promise.resolve().then(() => __importStar(require('../../common/stream/stream-hub')));
        const clientId = streamHub.register(res);
        const interval = setInterval(() => {
            res.write(': keep-alive\n\n');
        }, 15000);
        req.on('close', () => {
            clearInterval(interval);
            streamHub.unregister(clientId);
        });
    }
    async getOrderStatus(id) {
        const order = await this.kitchen.getOrder(id);
        if (!order)
            return null;
        return {
            order_id: order.id,
            status: order.status,
            arrival_status: order.arrival_status,
            fulfillment: order.fulfillment,
            channel: order.channel,
        };
    }
    async list(status, channel, fulfillment) {
        const orders = await this.kitchen.listOrders({
            status: status,
            channel: channel,
            fulfillment: fulfillment,
        });
        return { orders };
    }
    async getOrder(id) {
        return this.kitchen.getOrder(id);
    }
    async start(id) {
        return this.kitchen.updateStatus(id, 'in_prep');
    }
    async ready(id) {
        return this.kitchen.updateStatus(id, 'ready_waiting_arrival');
    }
    async serve(id) {
        return this.kitchen.updateStatus(id, 'served');
    }
    async deliver(id) {
        return this.kitchen.updateStatus(id, 'delivered');
    }
    async hold(id) {
        return this.kitchen.updateStatus(id, 'on_hold');
    }
    async resume(id) {
        return this.kitchen.updateStatus(id, 'in_prep');
    }
    async cancel(id) {
        return this.kitchen.updateStatus(id, 'canceled');
    }
    async arrive(id) {
        return this.kitchen.updateArrival(id);
    }
    async refire(id, body) {
        return this.kitchen.refire(id, body?.items, body?.reason);
    }
    async edit(id, body) {
        const items = Array.isArray(body?.items)
            ? body.items
                .map((i) => ({
                name: String(i.name || '').trim(),
                qty: Number(i.qty) || 1,
                modifiers: Array.isArray(i.modifiers) ? i.modifiers : [],
                allergies: Array.isArray(i.allergies) ? i.allergies : [],
                station: i.station ? String(i.station) : undefined,
                notes: i.notes ? String(i.notes) : undefined,
            }))
                .filter((i) => i.name)
            : [];
        return this.kitchen.editItems(id, items, {
            priority_flag: body?.priority_flag,
            prep_estimate_minutes: body?.prep_estimate_minutes ?? null,
        });
    }
    async manual(body) {
        return this.kitchen.manualCreate(body || {});
    }
    async demo() {
        return this.kitchen.demoSeed();
    }
};
exports.KitchenController = KitchenController;
__decorate([
    (0, common_1.Get)('stream'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "stream", null);
__decorate([
    (0, common_1.Get)('orders/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "getOrderStatus", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('channel')),
    __param(2, (0, common_1.Query)('fulfillment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/start'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('orders/:id/ready'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "ready", null);
__decorate([
    (0, common_1.Post)('orders/:id/serve'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "serve", null);
__decorate([
    (0, common_1.Post)('orders/:id/deliver'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "deliver", null);
__decorate([
    (0, common_1.Post)('orders/:id/hold'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "hold", null);
__decorate([
    (0, common_1.Post)('orders/:id/resume'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "resume", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('orders/:id/arrive'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "arrive", null);
__decorate([
    (0, common_1.Post)('orders/:id/refire'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    (0, swagger_1.ApiBody)({ schema: { example: { items: ['item_1'], reason: 'Overcooked' } } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "refire", null);
__decorate([
    (0, common_1.Post)('orders/:id/edit'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                items: [{ name: 'Jerk Chicken Plate', qty: 1, modifiers: ['Mild'], allergies: [], station: 'grill' }],
                priority_flag: false,
                prep_estimate_minutes: 20,
            },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "edit", null);
__decorate([
    (0, common_1.Post)('manual'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    (0, swagger_1.ApiBody)({ schema: { example: { order_id: 'ord_manual_1', items: [{ name: 'Plantains', qty: 2 }] } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "manual", null);
__decorate([
    (0, common_1.Post)('demo'),
    (0, common_1.UseGuards)(auth_guard_1.KitchenAccessGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KitchenController.prototype, "demo", null);
exports.KitchenController = KitchenController = __decorate([
    (0, swagger_1.ApiTags)('kitchen'),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    (0, common_1.Controller)('kitchen'),
    __metadata("design:paramtypes", [kitchen_service_1.KitchenService])
], KitchenController);
