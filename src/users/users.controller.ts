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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../auth/auth.service';
import { MembershipsService } from '../memberships/memberships.service';

interface AuthRequest extends Request {
	user: JwtPayload;
}

@Controller('users')
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly membershipService: MembershipsService,
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
}
