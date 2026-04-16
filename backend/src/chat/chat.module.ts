import { Module, forwardRef } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { MessagesModule } from "../messages/messages.module";
import { ConversationsModule } from "../conversations/conversations.module";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MessagesModule,
    // FIX #3: forwardRef to break the circular dependency
    // ConversationsModule <-> ChatModule
    forwardRef(() => ConversationsModule),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
