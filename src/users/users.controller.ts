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

interface AuthRequest extends Request {
	user: JwtPayload;
}

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

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
}
