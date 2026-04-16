import { Module, forwardRef } from "@nestjs/common";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { AuthModule } from "../auth/auth.module";
import { ChatModule } from "../chat/chat.module";

@Module({
  // FIX #3: Import ChatModule with forwardRef to avoid circular dependency
  imports: [AuthModule, forwardRef(() => ChatModule)],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
