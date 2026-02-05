import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CreateReplyDto, CreatePublicReplyDto, MarkReadDto, MyReviewsDto, RequestAccessDto } from './dto/reply.dto';
import { randomUUID, createHash } from 'crypto';
import nodemailer from 'nodemailer';

@Injectable()
export class ReviewsService {
  private mailer: nodemailer.Transporter | null = null;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    const user = this.config.get<string>('GMAIL_USER');
    const pass = this.config.get<string>('GMAIL_APP_PASSWORD');
    if (user && pass) {
      this.mailer = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }

  private toReview(r: any) {
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

  private toReply(r: any) {
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

  private reviewTokenTtlMinutes() {
    return Number(this.config.get<string>('REVIEW_ACCESS_TOKEN_TTL_MINUTES') || 30);
  }

  private reviewTokenRequired() {
    return this.config.get<string>('REVIEW_ACCESS_TOKEN_REQUIRED') !== 'false';
  }

  private reviewTokenReturn() {
    return this.config.get<string>('REVIEW_ACCESS_TOKEN_RETURN') === 'true';
  }

  private customerUrl() {
    return this.config.get<string>('CUSTOMER_URL') || this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueReviewAccessToken(email: string) {
    const token = randomUUID();
    const hashed = this.hashToken(token);
    const expiresAt = new Date(Date.now() + this.reviewTokenTtlMinutes() * 60 * 1000).toISOString();
    await this.prisma.reviewAccessToken.upsert({
      where: { email },
      update: { accessToken: hashed, expiresAt, lastRequestedAt: new Date() },
      create: { email, accessToken: hashed, expiresAt, lastRequestedAt: new Date() },
    });
    return { token, expiresAt };
  }

  async validateReviewAccessToken(email: string, token: string) {
    if (!token) return false;
    const hashed = this.hashToken(token);
    const record = await this.prisma.reviewAccessToken.findUnique({ where: { email } });
    if (!record) return false;
    if (record.accessToken !== hashed) return false;
    return new Date(record.expiresAt).getTime() > Date.now();
  }

  async sendReplyNotification(email: string, name: string, reviewId: string, message: string) {
    if (!this.mailer) return;
    const access = await this.issueReviewAccessToken(email);
    const link = `${this.customerUrl()}/reviews/conversation?email=${encodeURIComponent(email)}&token=${encodeURIComponent(
      access.token,
    )}`;
    await this.mailer.sendMail({
      from: this.config.get<string>('GMAIL_USER'),
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

  async get(id: string) {
    const review = await this.prisma.customerReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    return this.toReview(review);
  }

  async create(dto: CreateReviewDto) {
    const id = randomUUID();
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

  async update(id: string, dto: UpdateReviewDto) {
    const existing = await this.prisma.customerReview.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Review not found');

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

  async remove(id: string) {
    await this.prisma.reviewReply.deleteMany({ where: { reviewId: id } });
    const deleted = await this.prisma.customerReview.delete({ where: { id } });
    if (!deleted) throw new NotFoundException('Review not found');
    return { message: 'Review deleted successfully' };
  }

  async listReplies(reviewId: string) {
    const rows = await this.prisma.reviewReply.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toReply(r));
  }

  async createReply(reviewId: string, dto: CreateReplyDto) {
    const review = await this.prisma.customerReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    const id = randomUUID();
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

  async createPublicReply(reviewId: string, dto: CreatePublicReplyDto, authIsAdmin: boolean) {
    const review = await this.prisma.customerReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    if (this.reviewTokenRequired() && !authIsAdmin) {
      const ok = await this.validateReviewAccessToken(review.email || '', dto.accessToken || '');
      if (!ok) throw new UnauthorizedException('unauthorized');
    }

    const id = randomUUID();
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

  async deleteReply(reviewId: string, replyId: string) {
    const deleted = await this.prisma.reviewReply.deleteMany({ where: { id: replyId, reviewId } });
    if (deleted.count === 0) throw new NotFoundException('Reply not found');
    return { message: 'Reply deleted successfully' };
  }

  async myReviews(dto: MyReviewsDto, authIsAdmin: boolean) {
    const email = dto.email.toLowerCase().trim();
    if (this.reviewTokenRequired() && !authIsAdmin) {
      const ok = await this.validateReviewAccessToken(email, dto.accessToken || '');
      if (!ok) throw new UnauthorizedException('unauthorized');
    }

    const reviews = await this.prisma.customerReview.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    const results: any[] = [];
    for (const review of reviews) {
      const replies = await this.prisma.reviewReply.findMany({
        where: { reviewId: review.id },
        orderBy: { createdAt: 'asc' },
      });
      const unreadCount = replies.filter((r) => r.senderType === 'admin' && !r.isRead).length;
      results.push({
        ...this.toReview(review),
        replies: replies.map((r) => this.toReply(r)),
        unreadCount,
      });
    }
    return results;
  }

  async markRead(reviewId: string, dto: MarkReadDto, authIsAdmin: boolean) {
    if (this.reviewTokenRequired() && !authIsAdmin) {
      const review = await this.prisma.customerReview.findUnique({ where: { id: reviewId } });
      if (!review) throw new NotFoundException('Review not found');
      const ok = await this.validateReviewAccessToken(review.email || '', dto.accessToken || '');
      if (!ok) throw new UnauthorizedException('unauthorized');
    }

    await this.prisma.reviewReply.updateMany({
      where: { reviewId, senderType: dto.senderType },
      data: { isRead: true },
    });
    return { message: 'Replies marked as read' };
  }

  async adminConversations() {
    const reviews = await this.prisma.customerReview.findMany({ orderBy: { createdAt: 'desc' } });
    const enriched: any[] = [];

    for (const review of reviews) {
      const replies = await this.prisma.reviewReply.findMany({
        where: { reviewId: review.id },
        orderBy: { createdAt: 'asc' },
      });
      const unreadFromCustomer = replies.filter((r) => r.senderType === 'customer' && !r.isRead).length;
      const lastReply = replies.length ? replies[replies.length - 1] : null;
      enriched.push({
        ...this.toReview(review),
        replies: replies.map((r) => this.toReply(r)),
        unreadFromCustomer,
        hasConversation: replies.length > 0,
        lastReplyAt: lastReply ? Number(lastReply.createdAt) : null,
        lastReplyBy: lastReply ? lastReply.senderType : null,
      });
    }

    enriched.sort((a, b) => {
      if (a.unreadFromCustomer !== b.unreadFromCustomer) return b.unreadFromCustomer - a.unreadFromCustomer;
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

  async adminMarkRead(reviewId: string) {
    await this.prisma.reviewReply.updateMany({
      where: { reviewId, senderType: 'customer' },
      data: { isRead: true },
    });
    return { message: 'Customer replies marked as read' };
  }

  async adminConversation(reviewId: string) {
    const review = await this.prisma.customerReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

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

    const payload: any[] = [];
    for (const review of reviews) {
      const adminReplies = await this.prisma.reviewReply.findMany({
        where: { reviewId: review.id, senderType: 'admin' },
        orderBy: { createdAt: 'asc' },
      });
      payload.push({
        ...this.toReview(review),
        adminReplies: adminReplies.map((r) => this.toReply(r)),
      });
    }
    return payload;
  }

  async requestAccess(dto: RequestAccessDto) {
    const email = dto.email.toLowerCase().trim();
    const access = await this.issueReviewAccessToken(email);
    const link = `${this.customerUrl()}/reviews/conversation?email=${encodeURIComponent(email)}&token=${encodeURIComponent(
      access.token,
    )}`;

    if (this.mailer) {
      await this.mailer.sendMail({
        from: this.config.get<string>('GMAIL_USER'),
        to: email,
        subject: 'Bite Creole Kitchen - Review Access',
        html: `<p>Use this link to view your review conversation:</p><p><a href="${link}">View Conversation</a></p>`,
      });
    }

    const payload: {
      success: boolean;
      delivery: string;
      accessToken?: string;
      expiresAt?: string;
    } = { success: true, delivery: this.mailer ? 'email' : 'console' };

    if (this.reviewTokenReturn() || !this.mailer) {
      payload.accessToken = access.token;
      payload.expiresAt = access.expiresAt;
    }

    return payload;
  }
}
