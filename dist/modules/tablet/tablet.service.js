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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabletService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const LOCKED_STATUSES = new Set(['PAID', 'COMPLETED']);
let TabletService = class TabletService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    questionLimit() {
        return Number(this.config.get('TABLET_QUESTION_LIMIT') || 10);
    }
    warningAfterMs() {
        return Number(this.config.get('TABLET_WARNING_AFTER_MS') || 6 * 60 * 1000);
    }
    expireAfterMs() {
        return Number(this.config.get('TABLET_EXPIRE_AFTER_MS') || 7 * 60 * 1000);
    }
    normalizeOrderStatus(value) {
        const normalized = value.toUpperCase();
        if (normalized === 'NONE')
            return 'NONE';
        if (normalized === 'IN_PROGRESS')
            return 'IN_PROGRESS';
        if (normalized === 'PAID')
            return 'PAID';
        if (normalized === 'COMPLETED')
            return 'COMPLETED';
        return null;
    }
    isLocked(status) {
        return !!status && LOCKED_STATUSES.has(status);
    }
    clampRemaining(count) {
        return Math.max(0, this.questionLimit() - count);
    }
    async touchSession(options) {
        const now = new Date();
        const existing = await this.prisma.tabletSession.findUnique({ where: { tabletId: options.tabletId } });
        let session = existing;
        let sessionReset = false;
        let clearCart = false;
        let showPreTimeoutWarning = false;
        const lastActivity = session ? new Date(session.lastActivityTimestamp) : null;
        const inactivityMs = session && lastActivity ? now.getTime() - lastActivity.getTime() : 0;
        const lockedExisting = this.isLocked(session?.orderStatus);
        const lockedOverride = this.isLocked(options.orderStatusOverride);
        const ignoreTimeout = lockedExisting || lockedOverride;
        if (!session) {
            session = await this.prisma.tabletSession.create({
                data: {
                    tabletId: options.tabletId,
                    sessionId: (0, crypto_1.randomUUID)(),
                    questionCount: 0,
                    lastActivityTimestamp: now,
                    orderStatus: 'NONE',
                    warningSent: false,
                    agentConversationId: null,
                    conversationHistory: [],
                },
            });
            sessionReset = true;
            clearCart = true;
        }
        else if (!ignoreTimeout && inactivityMs >= this.expireAfterMs()) {
            session = await this.prisma.tabletSession.update({
                where: { tabletId: options.tabletId },
                data: {
                    sessionId: (0, crypto_1.randomUUID)(),
                    questionCount: 0,
                    warningSent: false,
                    orderStatus: 'NONE',
                    agentConversationId: null,
                    conversationHistory: [],
                    lastActivityTimestamp: now,
                },
            });
            sessionReset = true;
            clearCart = true;
        }
        else if (!ignoreTimeout && session.orderStatus === 'NONE' && !session.warningSent && inactivityMs >= this.warningAfterMs()) {
            session = await this.prisma.tabletSession.update({
                where: { tabletId: options.tabletId },
                data: { warningSent: true },
            });
            showPreTimeoutWarning = true;
        }
        let conversation = Array.isArray(session?.conversationHistory)
            ? session?.conversationHistory
            : [];
        if (sessionReset)
            conversation = [];
        if (options.appendMessage)
            conversation.push(options.appendMessage);
        if (options.appendMessages)
            conversation.push(...options.appendMessages);
        if (conversation.length > 20)
            conversation.splice(0, conversation.length - 20);
        const newQuestionCount = options.incrementQuestions && !this.isLocked(session?.orderStatus)
            ? Number(session?.questionCount || 0) + 1
            : Number(session?.questionCount || 0);
        const updated = await this.prisma.tabletSession.update({
            where: { tabletId: options.tabletId },
            data: {
                lastActivityTimestamp: now,
                questionCount: newQuestionCount,
                orderStatus: options.orderStatusOverride ?? session?.orderStatus ?? 'NONE',
                agentConversationId: options.setAgentConversationId ?? session?.agentConversationId ?? null,
                conversationHistory: conversation,
            },
        });
        const remainingQuestions = this.clampRemaining(Number(updated.questionCount || 0));
        return {
            session: updated,
            sessionReset,
            clearCart,
            showPreTimeoutWarning,
            remainingQuestions,
            questionLimitReached: Number(updated.questionCount || 0) > this.questionLimit(),
            locked: this.isLocked(updated.orderStatus),
            inactivityMs: inactivityMs < 0 ? 0 : inactivityMs,
            conversationHistory: conversation,
            agentConversationId: updated.agentConversationId ?? null,
        };
    }
};
exports.TabletService = TabletService;
exports.TabletService = TabletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], TabletService);
