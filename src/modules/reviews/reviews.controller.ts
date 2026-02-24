import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CreatePublicReplyDto, CreateReplyDto, MarkReadDto, MyReviewsDto, RequestAccessDto } from './dto/reply.dto';
import { AuthGuard, AdminGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(TenantRequiredGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  private isAdmin(req: Request) {
    const user = (req as any).user as { role?: string } | undefined;
    return user?.role === 'admin';
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async listAdmin(@CurrentTenant() tenant: TenantContext) {
    return this.reviews.listAdmin(tenant.id);
  }

  @Post('access/request')
  async requestAccess(@CurrentTenant() tenant: TenantContext, @Body() body: RequestAccessDto) {
    return this.reviews.requestAccess(tenant.id, body);
  }

  @Get('approved')
  async listApproved(@CurrentTenant() tenant: TenantContext) {
    return this.reviews.listApproved(tenant.id);
  }

  @Post()
  async create(@CurrentTenant() tenant: TenantContext, @Body() body: CreateReviewDto) {
    return this.reviews.create(tenant.id, body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async update(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: UpdateReviewDto) {
    return this.reviews.update(tenant.id, id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.reviews.remove(tenant.id, id);
  }

  @Get('admin/conversations')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async adminConversations(@CurrentTenant() tenant: TenantContext) {
    return this.reviews.adminConversations(tenant.id);
  }

  @Get('admin/unread-count')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async adminUnreadCount(@CurrentTenant() tenant: TenantContext) {
    return this.reviews.adminUnreadCount(tenant.id);
  }

  @Put('admin/:id/mark-read')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async adminMarkRead(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.reviews.adminMarkRead(tenant.id, id);
  }

  @Get('admin/:id/conversation')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async adminConversation(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.reviews.adminConversation(tenant.id, id);
  }

  @Get('public/with-replies')
  async publicWithReplies(@CurrentTenant() tenant: TenantContext) {
    return this.reviews.publicWithReplies(tenant.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.reviews.get(tenant.id, id);
  }

  @Get(':id/replies')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async listReplies(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.reviews.listReplies(tenant.id, id);
  }

  @Post(':id/replies')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async createReply(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: CreateReplyDto) {
    return this.reviews.createReply(tenant.id, id, body);
  }

  @Post(':id/replies/public')
  @UseGuards(OptionalAuthGuard)
  async createPublicReply(
    @Req() req: Request,
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: CreatePublicReplyDto,
  ) {
    return this.reviews.createPublicReply(tenant.id, id, body, this.isAdmin(req));
  }

  @Delete(':reviewId/replies/:replyId')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async deleteReply(@CurrentTenant() tenant: TenantContext, @Param('reviewId') reviewId: string, @Param('replyId') replyId: string) {
    return this.reviews.deleteReply(tenant.id, reviewId, replyId);
  }

  @Post('my-reviews')
  @UseGuards(OptionalAuthGuard)
  async myReviews(@Req() req: Request, @CurrentTenant() tenant: TenantContext, @Body() body: MyReviewsDto) {
    return this.reviews.myReviews(tenant.id, body, this.isAdmin(req));
  }

  @Put(':id/replies/mark-read')
  @UseGuards(OptionalAuthGuard)
  async markRead(@Req() req: Request, @CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: MarkReadDto) {
    return this.reviews.markRead(tenant.id, id, body, this.isAdmin(req));
  }
}
