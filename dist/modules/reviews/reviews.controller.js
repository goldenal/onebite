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
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reviews_service_1 = require("./reviews.service");
const create_review_dto_1 = require("./dto/create-review.dto");
const update_review_dto_1 = require("./dto/update-review.dto");
const reply_dto_1 = require("./dto/reply.dto");
const auth_guard_1 = require("../auth/auth.guard");
const tenant_required_guard_1 = require("../../common/tenant/tenant-required.guard");
const current_tenant_decorator_1 = require("../../common/tenant/current-tenant.decorator");
let ReviewsController = class ReviewsController {
    constructor(reviews) {
        this.reviews = reviews;
    }
    isAdmin(req) {
        const user = req.user;
        return user?.role === 'admin';
    }
    async listAdmin(tenant) {
        return this.reviews.listAdmin(tenant.id);
    }
    async requestAccess(tenant, body) {
        return this.reviews.requestAccess(tenant.id, body);
    }
    async listApproved(tenant) {
        return this.reviews.listApproved(tenant.id);
    }
    async create(tenant, body) {
        return this.reviews.create(tenant.id, body);
    }
    async update(tenant, id, body) {
        return this.reviews.update(tenant.id, id, body);
    }
    async remove(tenant, id) {
        return this.reviews.remove(tenant.id, id);
    }
    async adminConversations(tenant) {
        return this.reviews.adminConversations(tenant.id);
    }
    async adminUnreadCount(tenant) {
        return this.reviews.adminUnreadCount(tenant.id);
    }
    async adminMarkRead(tenant, id) {
        return this.reviews.adminMarkRead(tenant.id, id);
    }
    async adminConversation(tenant, id) {
        return this.reviews.adminConversation(tenant.id, id);
    }
    async publicWithReplies(tenant) {
        return this.reviews.publicWithReplies(tenant.id);
    }
    async get(tenant, id) {
        return this.reviews.get(tenant.id, id);
    }
    async listReplies(tenant, id) {
        return this.reviews.listReplies(tenant.id, id);
    }
    async createReply(tenant, id, body) {
        return this.reviews.createReply(tenant.id, id, body);
    }
    async createPublicReply(req, tenant, id, body) {
        return this.reviews.createPublicReply(tenant.id, id, body, this.isAdmin(req));
    }
    async deleteReply(tenant, reviewId, replyId) {
        return this.reviews.deleteReply(tenant.id, reviewId, replyId);
    }
    async myReviews(req, tenant, body) {
        return this.reviews.myReviews(tenant.id, body, this.isAdmin(req));
    }
    async markRead(req, tenant, id, body) {
        return this.reviews.markRead(tenant.id, id, body, this.isAdmin(req));
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "listAdmin", null);
__decorate([
    (0, common_1.Post)('access/request'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reply_dto_1.RequestAccessDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "requestAccess", null);
__decorate([
    (0, common_1.Get)('approved'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "listApproved", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_review_dto_1.UpdateReviewDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('admin/conversations'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "adminConversations", null);
__decorate([
    (0, common_1.Get)('admin/unread-count'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "adminUnreadCount", null);
__decorate([
    (0, common_1.Put)('admin/:id/mark-read'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "adminMarkRead", null);
__decorate([
    (0, common_1.Get)('admin/:id/conversation'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "adminConversation", null);
__decorate([
    (0, common_1.Get)('public/with-replies'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "publicWithReplies", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "get", null);
__decorate([
    (0, common_1.Get)(':id/replies'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "listReplies", null);
__decorate([
    (0, common_1.Post)(':id/replies'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reply_dto_1.CreateReplyDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "createReply", null);
__decorate([
    (0, common_1.Post)(':id/replies/public'),
    (0, common_1.UseGuards)(auth_guard_1.OptionalAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, reply_dto_1.CreatePublicReplyDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "createPublicReply", null);
__decorate([
    (0, common_1.Delete)(':reviewId/replies/:replyId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('reviewId')),
    __param(2, (0, common_1.Param)('replyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "deleteReply", null);
__decorate([
    (0, common_1.Post)('my-reviews'),
    (0, common_1.UseGuards)(auth_guard_1.OptionalAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, reply_dto_1.MyReviewsDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "myReviews", null);
__decorate([
    (0, common_1.Put)(':id/replies/mark-read'),
    (0, common_1.UseGuards)(auth_guard_1.OptionalAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, reply_dto_1.MarkReadDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "markRead", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('reviews'),
    (0, common_1.Controller)('reviews'),
    (0, common_1.UseGuards)(tenant_required_guard_1.TenantRequiredGuard),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
