import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export type OrderStatus = 'NONE' | 'IN_PROGRESS' | 'PAID' | 'COMPLETED';
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const LOCKED_STATUSES = new Set<OrderStatus>(['PAID', 'COMPLETED']);

@Injectable()
export class TabletService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  questionLimit() {
    return Number(this.config.get<string>('TABLET_QUESTION_LIMIT') || 10);
  }

  warningAfterMs() {
    return Number(this.config.get<string>('TABLET_WARNING_AFTER_MS') || 6 * 60 * 1000);
  }

  expireAfterMs() {
    return Number(this.config.get<string>('TABLET_EXPIRE_AFTER_MS') || 7 * 60 * 1000);
  }

  normalizeOrderStatus(value: string): OrderStatus | null {
    const normalized = value.toUpperCase();
    if (normalized === 'NONE') return 'NONE';
    if (normalized === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (normalized === 'PAID') return 'PAID';
    if (normalized === 'COMPLETED') return 'COMPLETED';
    return null;
  }

  private isLocked(status?: OrderStatus | null) {
    return !!status && LOCKED_STATUSES.has(status);
  }

  private clampRemaining(count: number) {
    return Math.max(0, this.questionLimit() - count);
  }

  async touchSession(options: {
  tabletId: string;
  incrementQuestions?: boolean;
  orderStatusOverride?: OrderStatus;
  appendMessage?: ConversationMessage;
  appendMessages?: ConversationMessage[];
  setAgentConversationId?: string | null;
}) {
  const now = new Date();

  // QUERY 1: Get existing session
  const existing = await this.prisma.tabletSession.findUnique({ 
    where: { tabletId: options.tabletId } 
  });

  let session = existing;
  let sessionReset = false;
  let clearCart = false;
  let showPreTimeoutWarning = false;

  const lastActivity = session ? new Date(session.lastActivityTimestamp) : null;
  const inactivityMs = session && lastActivity ? now.getTime() - lastActivity.getTime() : 0;
  const lockedExisting = this.isLocked(session?.orderStatus as OrderStatus | undefined);
  const lockedOverride = this.isLocked(options.orderStatusOverride);
  const ignoreTimeout = lockedExisting || lockedOverride;

  // Calculate all updates BEFORE touching database again
  let shouldResetSession = false;
  let shouldSendWarning = false;

  if (!session) {
    shouldResetSession = true;
    clearCart = true;
  } else if (!ignoreTimeout && inactivityMs >= this.expireAfterMs()) {
    shouldResetSession = true;
    clearCart = true;
  } else if (
    !ignoreTimeout && 
    session.orderStatus === 'NONE' && 
    !session.warningSent && 
    inactivityMs >= this.warningAfterMs()
  ) {
    shouldSendWarning = true;
    showPreTimeoutWarning = true;
  }

  // Prepare conversation history
  let conversation: ConversationMessage[] = Array.isArray(session?.conversationHistory)
    ? (session?.conversationHistory as any)
    : [];
  
  if (shouldResetSession) {
    conversation = [];
    sessionReset = true;
  }

  if (options.appendMessage) conversation.push(options.appendMessage);
  if (options.appendMessages) conversation.push(...options.appendMessages);
  if (conversation.length > 20) conversation.splice(0, conversation.length - 20);

  const newQuestionCount = options.incrementQuestions && !this.isLocked(session?.orderStatus as any)
    ? Number(session?.questionCount || 0) + 1
    : Number(session?.questionCount || 0);

  // QUERY 2: Single upsert with all updates
  const updated = await this.prisma.tabletSession.upsert({
    where: { tabletId: options.tabletId },
    create: {
      tabletId: options.tabletId,
      sessionId: randomUUID(),
      questionCount: newQuestionCount,
      lastActivityTimestamp: now,
      orderStatus: options.orderStatusOverride ?? 'NONE',
      warningSent: shouldSendWarning,
      agentConversationId: options.setAgentConversationId ?? null,
      conversationHistory: conversation as any,
    },
    update: shouldResetSession ? {
      // Reset everything
      sessionId: randomUUID(),
      questionCount: newQuestionCount,
      warningSent: false,
      orderStatus: options.orderStatusOverride ?? 'NONE',
      agentConversationId: options.setAgentConversationId ?? null,
      conversationHistory: conversation as any,
      lastActivityTimestamp: now,
    } : {
      // Normal update
      lastActivityTimestamp: now,
      questionCount: newQuestionCount,
      orderStatus: options.orderStatusOverride ?? session?.orderStatus ?? 'NONE',
      agentConversationId: options.setAgentConversationId ?? session?.agentConversationId ?? null,
      conversationHistory: conversation as any,
      warningSent: shouldSendWarning ? true : (session?.warningSent ?? false),
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
    locked: this.isLocked(updated.orderStatus as any),
    inactivityMs: inactivityMs < 0 ? 0 : inactivityMs,
    conversationHistory: conversation,
    agentConversationId: updated.agentConversationId ?? null,
  };
}
}
