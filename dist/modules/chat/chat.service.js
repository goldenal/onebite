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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const tablet_service_1 = require("../tablet/tablet.service");
let ChatService = ChatService_1 = class ChatService {
    constructor(prisma, tablet, config) {
        this.prisma = prisma;
        this.tablet = tablet;
        this.config = config;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    async handleChat(body) {
        const tabletId = (body.tabletId || 'default-tablet').trim();
        const sessionResult = await this.tablet.touchSession({ tabletId, incrementQuestions: true });
        const sessionPayload = {
            sessionId: sessionResult.session.sessionId,
            tabletId: sessionResult.session.tabletId,
            questionCount: Number(sessionResult.session.questionCount || 0),
            remainingQuestions: sessionResult.remainingQuestions,
            orderStatus: sessionResult.session.orderStatus,
            warningSent: sessionResult.session.warningSent,
            showPreTimeoutWarning: sessionResult.showPreTimeoutWarning,
            sessionReset: sessionResult.sessionReset,
            clearCart: sessionResult.clearCart,
            locked: sessionResult.locked,
        };
        if (sessionResult.locked) {
            return {
                ...sessionPayload,
                chatDisabled: true,
                message: 'Chat is disabled while your order is being processed. Please wait for the order to finish.',
            };
        }
        if (sessionResult.questionLimitReached) {
            return {
                ...sessionPayload,
                questionLimitReached: true,
                message: 'This conversation has reached its question limit. Please place your order or wait for a new session.',
            };
        }
        // Simple placeholder response; OpenAI/Groq/ElevenLabs wiring is next
        const assistantMessage = `This is a placeholder response. You said: "${body.message}"`;
        await this.tablet.touchSession({
            tabletId,
            appendMessages: [
                { role: 'user', content: body.message },
                { role: 'assistant', content: assistantMessage },
            ],
        });
        return {
            ...sessionPayload,
            message: assistantMessage,
            questionLimitReached: false,
            chatDisabled: false,
        };
    }
    async reset(tabletId) {
        const id = (tabletId || 'default-tablet').trim();
        try {
            await this.prisma.tabletSession.update({
                where: { tabletId: id },
                data: { conversationHistory: [], questionCount: 0, warningSent: false, agentConversationId: null },
            });
        }
        catch (error) {
            if (error?.code !== 'P2025') {
                this.logger.error(`Failed to reset chat session for tabletId=${id}`, error?.stack || String(error));
                throw error;
            }
        }
        return { success: true, message: 'Conversation reset' };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tablet_service_1.TabletService,
        config_1.ConfigService])
], ChatService);
