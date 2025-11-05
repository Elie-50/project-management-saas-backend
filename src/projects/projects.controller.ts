import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	HttpCode,
	HttpStatus,
	UseGuards,
	Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../auth/auth.service';
import { TasksService } from '../tasks/tasks.service';

interface AuthRequest extends Request {
	user: JwtPayload;
}

@Controller('api/projects')
export class ProjectsController {
	constructor(
		private readonly projectsService: ProjectsService,
		private readonly tasksService: TasksService,
	) {}

	@HttpCode(HttpStatus.CREATED)
	@UseGuards(AuthGuard)
	@Post()
	create(@Req() req: AuthRequest, @Body() createProjectDto: CreateProjectDto) {
		return this.projectsService.create(createProjectDto, req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get(':id')
	findOne(@Req() req: AuthRequest, @Param('id') id: string) {
		return this.projectsService.findOne(id, req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Patch(':id')
	update(
		@Param('id') id: string,
		@Req() req: AuthRequest,
		@Body() updateProjectDto: { name: string },
	) {
		return this.projectsService.update(id, updateProjectDto.name, req.user.id);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
	@Delete(':id')
	remove(@Req() req: AuthRequest, @Param('id') id: string) {
		return this.projectsService.remove(id, req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get(':id/tasks')
	findAllTasks(@Req() req: AuthRequest, @Param('id') id: string) {
		return this.tasksService.findAllProjectTasks(id, req.user.id);
	}
}
