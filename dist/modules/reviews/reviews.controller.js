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
let ReviewsController = class ReviewsController {
    constructor(reviews) {
        this.reviews = reviews;
    }
    isAdmin(req) {
        const user = req.user;
        return user?.role === 'admin';
    }
    async listAdmin() {
        return this.reviews.listAdmin();
    }
    async requestAccess(body) {
        return this.reviews.requestAccess(body);
    }
    async listApproved() {
        return this.reviews.listApproved();
    }
    async create(body) {
        return this.reviews.create(body);
    }
    async update(id, body) {
        return this.reviews.update(id, body);
    }
    async remove(id) {
        return this.reviews.remove(id);
    }
    async adminConversations() {
        return this.reviews.adminConversations();
    }
    async adminUnreadCount() {
        return this.reviews.adminUnreadCount();
    }
    async adminMarkRead(id) {
        return this.reviews.adminMarkRead(id);
    }
    async adminConversation(id) {
        return this.reviews.adminConversation(id);
    }
    async publicWithReplies() {
        return this.reviews.publicWithReplies();
    }
    async get(id) {
        return this.reviews.get(id);
    }
    async listReplies(id) {
        return this.reviews.listReplies(id);
    }
    async createReply(id, body) {
        return this.reviews.createReply(id, body);
    }
    async createPublicReply(req, id, body) {
        return this.reviews.createPublicReply(id, body, this.isAdmin(req));
    }
    async deleteReply(reviewId, replyId) {
        return this.reviews.deleteReply(reviewId, replyId);
    }
    async myReviews(req, body) {
        return this.reviews.myReviews(body, this.isAdmin(req));
    }
    async markRead(req, id, body) {
        return this.reviews.markRead(id, body, this.isAdmin(req));
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "listAdmin", null);
__decorate([
    (0, common_1.Post)('access/request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reply_dto_1.RequestAccessDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "requestAccess", null);
__decorate([
    (0, common_1.Get)('approved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "listApproved", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_review_dto_1.UpdateReviewDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('admin/conversations'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "adminConversations", null);
__decorate([
    (0, common_1.Get)('admin/unread-count'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "adminUnreadCount", null);
__decorate([
    (0, common_1.Put)('admin/:id/mark-read'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "adminMarkRead", null);
__decorate([
    (0, common_1.Get)('admin/:id/conversation'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "adminConversation", null);
__decorate([
    (0, common_1.Get)('public/with-replies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "publicWithReplies", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "get", null);
__decorate([
    (0, common_1.Get)(':id/replies'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "listReplies", null);
__decorate([
    (0, common_1.Post)(':id/replies'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reply_dto_1.CreateReplyDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "createReply", null);
__decorate([
    (0, common_1.Post)(':id/replies/public'),
    (0, common_1.UseGuards)(auth_guard_1.OptionalAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reply_dto_1.CreatePublicReplyDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "createPublicReply", null);
__decorate([
    (0, common_1.Delete)(':reviewId/replies/:replyId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Param)('replyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "deleteReply", null);
__decorate([
    (0, common_1.Post)('my-reviews'),
    (0, common_1.UseGuards)(auth_guard_1.OptionalAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reply_dto_1.MyReviewsDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "myReviews", null);
__decorate([
    (0, common_1.Put)(':id/replies/mark-read'),
    (0, common_1.UseGuards)(auth_guard_1.OptionalAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reply_dto_1.MarkReadDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "markRead", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('reviews'),
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
