import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TabletService } from '../tablet/tablet.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tablet: TabletService,
    private readonly config: ConfigService,
  ) {}

  async handleChat(body: { message: string; sessionId?: string; tabletId?: string }) {
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

  async reset(tabletId?: string) {
    const id = (tabletId || 'default-tablet').trim();
    await this.prisma.tabletSession.update({
      where: { tabletId: id },
      data: { conversationHistory: [], questionCount: 0, warningSent: false, agentConversationId: null },
    }).catch(() => null);
    return { success: true, message: 'Conversation reset' };
  }
}
