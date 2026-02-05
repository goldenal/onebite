import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CreatePublicReplyDto, CreateReplyDto, MarkReadDto, MyReviewsDto, RequestAccessDto } from './dto/reply.dto';
import { AuthGuard, AdminGuard, OptionalAuthGuard } from '../auth/auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  private isAdmin(req: Request) {
    const user = (req as any).user as { role?: string } | undefined;
    return user?.role === 'admin';
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  async listAdmin() {
    return this.reviews.listAdmin();
  }

  @Post('access/request')
  async requestAccess(@Body() body: RequestAccessDto) {
    return this.reviews.requestAccess(body);
  }

  @Get('approved')
  async listApproved() {
    return this.reviews.listApproved();
  }

  @Post()
  async create(@Body() body: CreateReviewDto) {
    return this.reviews.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async update(@Param('id') id: string, @Body() body: UpdateReviewDto) {
    return this.reviews.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async remove(@Param('id') id: string) {
    return this.reviews.remove(id);
  }

  @Get('admin/conversations')
  @UseGuards(AuthGuard, AdminGuard())
  async adminConversations() {
    return this.reviews.adminConversations();
  }

  @Get('admin/unread-count')
  @UseGuards(AuthGuard, AdminGuard())
  async adminUnreadCount() {
    return this.reviews.adminUnreadCount();
  }

  @Put('admin/:id/mark-read')
  @UseGuards(AuthGuard, AdminGuard())
  async adminMarkRead(@Param('id') id: string) {
    return this.reviews.adminMarkRead(id);
  }

  @Get('admin/:id/conversation')
  @UseGuards(AuthGuard, AdminGuard())
  async adminConversation(@Param('id') id: string) {
    return this.reviews.adminConversation(id);
  }

  @Get('public/with-replies')
  async publicWithReplies() {
    return this.reviews.publicWithReplies();
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async get(@Param('id') id: string) {
    return this.reviews.get(id);
  }

  @Get(':id/replies')
  @UseGuards(AuthGuard, AdminGuard())
  async listReplies(@Param('id') id: string) {
    return this.reviews.listReplies(id);
  }

  @Post(':id/replies')
  @UseGuards(AuthGuard, AdminGuard())
  async createReply(@Param('id') id: string, @Body() body: CreateReplyDto) {
    return this.reviews.createReply(id, body);
  }

  @Post(':id/replies/public')
  @UseGuards(OptionalAuthGuard)
  async createPublicReply(@Req() req: Request, @Param('id') id: string, @Body() body: CreatePublicReplyDto) {
    return this.reviews.createPublicReply(id, body, this.isAdmin(req));
  }

  @Delete(':reviewId/replies/:replyId')
  @UseGuards(AuthGuard, AdminGuard())
  async deleteReply(@Param('reviewId') reviewId: string, @Param('replyId') replyId: string) {
    return this.reviews.deleteReply(reviewId, replyId);
  }

  @Post('my-reviews')
  @UseGuards(OptionalAuthGuard)
  async myReviews(@Req() req: Request, @Body() body: MyReviewsDto) {
    return this.reviews.myReviews(body, this.isAdmin(req));
  }

  @Put(':id/replies/mark-read')
  @UseGuards(OptionalAuthGuard)
  async markRead(@Req() req: Request, @Param('id') id: string, @Body() body: MarkReadDto) {
    return this.reviews.markRead(id, body, this.isAdmin(req));
  }
}
