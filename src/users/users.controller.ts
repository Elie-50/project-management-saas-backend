import {
	Controller,
	Get,
	Body,
	Patch,
	Delete,
	HttpCode,
	HttpStatus,
	UseGuards,
	Req,
	Query,
	Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../auth/auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { TasksService } from '../tasks/tasks.service';

interface AuthRequest extends Request {
	user: JwtPayload;
}

@Controller('api/users')
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly membershipService: MembershipsService,
		private readonly tasksService: TasksService,
	) {}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get('me')
	findOne(@Req() req: AuthRequest) {
		return this.usersService.findById(req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Patch('me')
	async update(@Req() req: AuthRequest, @Body() body: UpdateUserDto) {
		return this.usersService.update(req.user?.id, body);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
	@Delete('me')
	remove(@Req() req: AuthRequest) {
		return this.usersService.remove(req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get('me/memberships')
	findMemberships(@Req() req: AuthRequest) {
		return this.membershipService.findAllMemberships(req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get('search')
	async searchUsers(@Query('q') q: string, @Query('page') page = 1) {
		const pageNum = Number(page) || 1;
		return this.usersService.searchUsersByName(q, pageNum);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get('me/projects/:id/tasks')
	findAllTasks(@Req() req: AuthRequest, @Param('id') id: string) {
		return this.tasksService.findAllUsersTasks(req.user.id, id);
	}
}
