import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("search")
  search(@Query("q") query: string, @Request() req) {
    return this.usersService.searchUsers(query, req.user.id);
  }

  @Get("contacts")
  getContacts(@Request() req) {
    return this.usersService.getContacts(req.user.id);
  }

  @Post("contacts/:contactId")
  addContact(
    @Param("contactId") contactId: string,
    @Body("nickname") nickname: string,
    @Request() req,
  ) {
    return this.usersService.addContact(req.user.id, contactId, nickname);
  }

  // FIX #2: PUT /users/profile MUST come before GET /users/:id
  // Otherwise NestJS matches "profile" as the :id param and this route is never reached
  @Put("profile")
  updateProfile(@Body() body: any, @Request() req) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  // FIX #2: This wildcard route is now last so it doesn't swallow /profile, /search, /contacts
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }
}
