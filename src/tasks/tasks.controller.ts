import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	HttpCode,
	HttpStatus,
	Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../auth/auth.service';

interface AuthRequest extends Request {
	user: JwtPayload;
}

@Controller('api/tasks')
export class TasksController {
	constructor(private readonly tasksService: TasksService) {}

	@HttpCode(HttpStatus.CREATED)
	@UseGuards(AuthGuard)
	@Post()
	create(@Req() req: AuthRequest, @Body() createTaskDto: CreateTaskDto) {
		return this.tasksService.create(createTaskDto, req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get(':id')
	findOne(@Req() req: AuthRequest, @Param('id') id: string) {
		return this.tasksService.findOne(id, req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Patch(':id')
	update(
		@Req() req: AuthRequest,
		@Param('id') id: string,
		@Body() updateTaskDto: UpdateTaskDto,
	) {
		return this.tasksService.update(id, updateTaskDto, req.user.id);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
	@Delete(':id')
	remove(@Req() req: AuthRequest, @Param('id') id: string) {
		return this.tasksService.remove(id, req.user.id);
	}
}
