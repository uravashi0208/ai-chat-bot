import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, Request
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';

@Controller('conversations/:conversationId/messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit: string,
    @Query('before') before: string,
    @Request() req,
  ) {
    return this.messagesService.getMessages(
      conversationId,
      req.user.id,
      limit ? parseInt(limit) : 50,
      before,
    );
  }

  @Post()
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: {
      content: string;
      type?: string;
      mediaUrl?: string;
      mediaThumbnail?: string;
      mediaSize?: number;
      mediaDuration?: number;
      replyToId?: string;
      isForwarded?: boolean;
    },
    @Request() req,
  ) {
    return this.messagesService.sendMessage(
      conversationId,
      req.user.id,
      body.content,
      body.type,
      body,
    );
  }

  @Put(':messageId')
  editMessage(
    @Param('messageId') messageId: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.messagesService.editMessage(messageId, req.user.id, content);
  }

  @Delete(':messageId')
  deleteMessage(@Param('messageId') messageId: string, @Request() req) {
    return this.messagesService.deleteMessage(messageId, req.user.id);
  }

  @Post(':messageId/reactions')
  addReaction(
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
    @Request() req,
  ) {
    return this.messagesService.addReaction(messageId, req.user.id, emoji);
  }

  @Delete(':messageId/reactions/:emoji')
  removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @Request() req,
  ) {
    return this.messagesService.removeReaction(messageId, req.user.id, emoji);
  }
}
