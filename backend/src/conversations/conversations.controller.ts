import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
@UseGuards(AuthGuard('jwt'))
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  getUserConversations(@Request() req) {
    return this.conversationsService.getUserConversations(req.user.id);
  }

  @Post('direct/:targetUserId')
  findOrCreateDirect(@Param('targetUserId') targetUserId: string, @Request() req) {
    return this.conversationsService.findOrCreateDirectConversation(req.user.id, targetUserId);
  }

  @Post('group')
  createGroup(
    @Body() body: { name: string; participantIds: string[]; description?: string },
    @Request() req,
  ) {
    return this.conversationsService.createGroupConversation(
      req.user.id,
      body.name,
      body.participantIds,
      body.description,
    );
  }

  @Get(':id')
  getConversation(@Param('id') id: string, @Request() req) {
    return this.conversationsService.getConversationById(id, req.user.id);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.conversationsService.markAsRead(id, req.user.id);
  }
}
