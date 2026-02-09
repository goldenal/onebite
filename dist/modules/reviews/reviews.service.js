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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_1 = require("crypto");
const nodemailer_1 = __importDefault(require("nodemailer"));
let ReviewsService = class ReviewsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.mailer = null;
        const user = this.config.get('GMAIL_USER');
        const pass = this.config.get('GMAIL_APP_PASSWORD');
        if (user && pass) {
            this.mailer = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: { user, pass },
            });
        }
    }
    toReview(r) {
        return {
            id: r.id,
            name: r.name,
            email: r.email,
            rating: r.rating,
            review: r.review,
            occasion: r.occasion,
            date: r.date,
            approved: r.approved === true || r.approved === 1,
            visible: r.visible === true || r.visible === 1,
            adminNotes: r.adminNotes,
            createdAt: r.createdAt ? Number(r.createdAt) : null,
        };
    }
    toReply(r) {
        return {
            id: r.id,
            reviewId: r.reviewId,
            senderType: r.senderType,
            senderName: r.senderName,
            message: r.message,
            isRead: r.isRead === true || r.isRead === 1,
            createdAt: r.createdAt ? Number(r.createdAt) : null,
        };
    }
    reviewTokenTtlMinutes() {
        return Number(this.config.get('REVIEW_ACCESS_TOKEN_TTL_MINUTES') || 30);
    }
    reviewTokenRequired() {
        return this.config.get('REVIEW_ACCESS_TOKEN_REQUIRED') !== 'false';
    }
    reviewTokenReturn() {
        return this.config.get('REVIEW_ACCESS_TOKEN_RETURN') === 'true';
    }
    customerUrl() {
        return this.config.get('CUSTOMER_URL') || this.config.get('FRONTEND_URL') || 'http://localhost:5173';
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async issueReviewAccessToken(email) {
        const token = (0, crypto_1.randomUUID)();
        const hashed = this.hashToken(token);
        const expiresAt = new Date(Date.now() + this.reviewTokenTtlMinutes() * 60 * 1000).toISOString();
        await this.prisma.reviewAccessToken.upsert({
            where: { email },
            update: { accessToken: hashed, expiresAt, lastRequestedAt: new Date() },
            create: { email, accessToken: hashed, expiresAt, lastRequestedAt: new Date() },
        });
        return { token, expiresAt };
    }
    async validateReviewAccessToken(email, token) {
        if (!token)
            return false;
        const hashed = this.hashToken(token);
        const record = await this.prisma.reviewAccessToken.findUnique({ where: { email } });
        if (!record)
            return false;
        if (record.accessToken !== hashed)
            return false;
        return new Date(record.expiresAt).getTime() > Date.now();
    }
    async sendReplyNotification(email, name, reviewId, message) {
        if (!this.mailer)
            return;
        const access = await this.issueReviewAccessToken(email);
        const link = `${this.customerUrl()}/reviews/conversation?email=${encodeURIComponent(email)}&token=${encodeURIComponent(access.token)}`;
        await this.mailer.sendMail({
            from: this.config.get('GMAIL_USER'),
            to: email,
            subject: 'Bite Creole Kitchen - Response to Your Review',
            html: `<p>Dear ${name},</p><p>We responded to your review:</p><blockquote>${message}</blockquote><p><a href="${link}">View Conversation</a></p>`,
        });
    }
    async listAdmin() {
        const rows = await this.prisma.customerReview.findMany({ orderBy: { createdAt: 'desc' } });
        return rows.map((r) => this.toReview(r));
    }
    async listApproved() {
        const rows = await this.prisma.customerReview.findMany({
            where: { approved: true, visible: true },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((r) => this.toReview(r));
    }
    async get(id) {
        const review = await this.prisma.customerReview.findUnique({ where: { id } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        return this.toReview(review);
    }
    async create(dto) {
        const id = (0, crypto_1.randomUUID)();
        const createdAt = BigInt(Date.now());
        const date = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        await this.prisma.customerReview.create({
            data: {
                id,
                name: dto.name,
                email: dto.email,
                rating: dto.rating,
                review: dto.review,
                occasion: dto.occasion ?? '',
                date,
                approved: false,
                visible: false,
                createdAt,
            },
        });
        return { id, ...dto, date, approved: false, visible: false, createdAt: Number(createdAt) };
    }
    async update(id, dto) {
        const existing = await this.prisma.customerReview.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Review not found');
        const updated = await this.prisma.customerReview.update({
            where: { id },
            data: {
                approved: dto.approved ?? existing.approved,
                visible: dto.visible ?? existing.visible,
                adminNotes: dto.adminNotes ?? existing.adminNotes,
            },
        });
        return this.toReview(updated);
    }
    async remove(id) {
        await this.prisma.reviewReply.deleteMany({ where: { reviewId: id } });
        const deleted = await this.prisma.customerReview.delete({ where: { id } });
        if (!deleted)
            throw new common_1.NotFoundException('Review not found');
        return { message: 'Review deleted successfully' };
    }
    async listReplies(reviewId) {
        const rows = await this.prisma.reviewReply.findMany({
            where: { reviewId },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map((r) => this.toReply(r));
    }
    async createReply(reviewId, dto) {
        const review = await this.prisma.customerReview.findUnique({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        const id = (0, crypto_1.randomUUID)();
        const createdAt = BigInt(Date.now());
        const reply = await this.prisma.reviewReply.create({
            data: {
                id,
                reviewId,
                senderType: dto.senderType,
                senderName: dto.senderName,
                message: dto.message,
                isRead: false,
                createdAt,
            },
        });
        if (dto.senderType === 'admin') {
            await this.sendReplyNotification(review.email || '', review.name || '', reviewId, dto.message);
        }
        return this.toReply(reply);
    }
    async createPublicReply(reviewId, dto, authIsAdmin) {
        const review = await this.prisma.customerReview.findUnique({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        if (this.reviewTokenRequired() && !authIsAdmin) {
            const ok = await this.validateReviewAccessToken(review.email || '', dto.accessToken || '');
            if (!ok)
                throw new common_1.UnauthorizedException('unauthorized');
        }
        const id = (0, crypto_1.randomUUID)();
        const createdAt = BigInt(Date.now());
        const senderName = dto.senderName || review.name || 'Customer';
        const reply = await this.prisma.reviewReply.create({
            data: {
                id,
                reviewId,
                senderType: 'customer',
                senderName,
                message: dto.message,
                isRead: false,
                createdAt,
            },
        });
        return this.toReply(reply);
    }
    async deleteReply(reviewId, replyId) {
        const deleted = await this.prisma.reviewReply.deleteMany({ where: { id: replyId, reviewId } });
        if (deleted.count === 0)
            throw new common_1.NotFoundException('Reply not found');
        return { message: 'Reply deleted successfully' };
    }
    async myReviews(dto, authIsAdmin) {
        const email = dto.email.toLowerCase().trim();
        if (this.reviewTokenRequired() && !authIsAdmin) {
            const ok = await this.validateReviewAccessToken(email, dto.accessToken || '');
            if (!ok)
                throw new common_1.UnauthorizedException('unauthorized');
        }
        const reviews = await this.prisma.customerReview.findMany({
            where: { email },
            orderBy: { createdAt: 'desc' },
        });
        const reviewIds = reviews.map((review) => review.id);
        const replies = reviewIds.length
            ? await this.prisma.reviewReply.findMany({
                where: { reviewId: { in: reviewIds } },
                orderBy: [{ reviewId: 'asc' }, { createdAt: 'asc' }],
            })
            : [];
        const repliesByReview = new Map();
        for (const reply of replies) {
            if (!reply.reviewId)
                continue;
            const list = repliesByReview.get(reply.reviewId) || [];
            list.push(reply);
            repliesByReview.set(reply.reviewId, list);
        }
        const results = [];
        for (const review of reviews) {
            const reviewReplies = repliesByReview.get(review.id) || [];
            const unreadCount = reviewReplies.filter((r) => r.senderType === 'admin' && !r.isRead).length;
            results.push({
                ...this.toReview(review),
                replies: reviewReplies.map((r) => this.toReply(r)),
                unreadCount,
            });
        }
        return results;
    }
    async markRead(reviewId, dto, authIsAdmin) {
        if (this.reviewTokenRequired() && !authIsAdmin) {
            const review = await this.prisma.customerReview.findUnique({ where: { id: reviewId } });
            if (!review)
                throw new common_1.NotFoundException('Review not found');
            const ok = await this.validateReviewAccessToken(review.email || '', dto.accessToken || '');
            if (!ok)
                throw new common_1.UnauthorizedException('unauthorized');
        }
        await this.prisma.reviewReply.updateMany({
            where: { reviewId, senderType: dto.senderType },
            data: { isRead: true },
        });
        return { message: 'Replies marked as read' };
    }
    async adminConversations() {
        const reviews = await this.prisma.customerReview.findMany({ orderBy: { createdAt: 'desc' } });
        const reviewIds = reviews.map((review) => review.id);
        const replies = reviewIds.length
            ? await this.prisma.reviewReply.findMany({
                where: { reviewId: { in: reviewIds } },
                orderBy: [{ reviewId: 'asc' }, { createdAt: 'asc' }],
            })
            : [];
        const repliesByReview = new Map();
        for (const reply of replies) {
            if (!reply.reviewId)
                continue;
            const list = repliesByReview.get(reply.reviewId) || [];
            list.push(reply);
            repliesByReview.set(reply.reviewId, list);
        }
        const enriched = [];
        for (const review of reviews) {
            const reviewReplies = repliesByReview.get(review.id) || [];
            const unreadFromCustomer = reviewReplies.filter((r) => r.senderType === 'customer' && !r.isRead).length;
            const lastReply = reviewReplies.length ? reviewReplies[reviewReplies.length - 1] : null;
            enriched.push({
                ...this.toReview(review),
                replies: reviewReplies.map((r) => this.toReply(r)),
                unreadFromCustomer,
                hasConversation: reviewReplies.length > 0,
                lastReplyAt: lastReply ? Number(lastReply.createdAt) : null,
                lastReplyBy: lastReply ? lastReply.senderType : null,
            });
        }
        enriched.sort((a, b) => {
            if (a.unreadFromCustomer !== b.unreadFromCustomer)
                return b.unreadFromCustomer - a.unreadFromCustomer;
            const aAct = a.lastReplyAt || a.createdAt;
            const bAct = b.lastReplyAt || b.createdAt;
            return bAct - aAct;
        });
        return enriched;
    }
    async adminUnreadCount() {
        const unreadReplies = await this.prisma.reviewReply.count({
            where: { senderType: 'customer', isRead: false },
        });
        const pending = await this.prisma.customerReview.count({ where: { approved: false } });
        return { unreadReplies, pendingReviews: pending, total: unreadReplies + pending };
    }
    async adminMarkRead(reviewId) {
        await this.prisma.reviewReply.updateMany({
            where: { reviewId, senderType: 'customer' },
            data: { isRead: true },
        });
        return { message: 'Customer replies marked as read' };
    }
    async adminConversation(reviewId) {
        const review = await this.prisma.customerReview.findUnique({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        const replies = await this.prisma.reviewReply.findMany({
            where: { reviewId },
            orderBy: { createdAt: 'asc' },
        });
        await this.prisma.reviewReply.updateMany({
            where: { reviewId, senderType: 'customer' },
            data: { isRead: true },
        });
        return { ...this.toReview(review), replies: replies.map((r) => this.toReply(r)) };
    }
    async publicWithReplies() {
        const reviews = await this.prisma.customerReview.findMany({
            where: { approved: true, visible: true },
            orderBy: { createdAt: 'desc' },
        });
        const reviewIds = reviews.map((review) => review.id);
        const adminReplies = reviewIds.length
            ? await this.prisma.reviewReply.findMany({
                where: { reviewId: { in: reviewIds }, senderType: 'admin' },
                orderBy: [{ reviewId: 'asc' }, { createdAt: 'asc' }],
            })
            : [];
        const adminRepliesByReview = new Map();
        for (const reply of adminReplies) {
            if (!reply.reviewId)
                continue;
            const list = adminRepliesByReview.get(reply.reviewId) || [];
            list.push(reply);
            adminRepliesByReview.set(reply.reviewId, list);
        }
        const payload = [];
        for (const review of reviews) {
            const reviewAdminReplies = adminRepliesByReview.get(review.id) || [];
            payload.push({
                ...this.toReview(review),
                adminReplies: reviewAdminReplies.map((r) => this.toReply(r)),
            });
        }
        return payload;
    }
    async requestAccess(dto) {
        const email = dto.email.toLowerCase().trim();
        const access = await this.issueReviewAccessToken(email);
        const link = `${this.customerUrl()}/reviews/conversation?email=${encodeURIComponent(email)}&token=${encodeURIComponent(access.token)}`;
        if (this.mailer) {
            await this.mailer.sendMail({
                from: this.config.get('GMAIL_USER'),
                to: email,
                subject: 'Bite Creole Kitchen - Review Access',
                html: `<p>Use this link to view your review conversation:</p><p><a href="${link}">View Conversation</a></p>`,
            });
        }
        const payload = { success: true, delivery: this.mailer ? 'email' : 'console' };
        if (this.reviewTokenReturn() || !this.mailer) {
            payload.accessToken = access.token;
            payload.expiresAt = access.expiresAt;
        }
        return payload;
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], ReviewsService);
