import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Req,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../auth/auth.service';

interface AuthRequest extends Request {
	user: JwtPayload;
}

@Controller('organizations')
export class OrganizationsController {
	constructor(private readonly organizationsService: OrganizationsService) {}

	@HttpCode(HttpStatus.CREATED)
	@UseGuards(AuthGuard)
	@Post()
	create(
		@Body() createOrganizationDto: CreateOrganizationDto,
		@Req() req: AuthRequest,
	) {
		return this.organizationsService.create(createOrganizationDto, req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get()
	findAll(@Req() req: AuthRequest) {
		return this.organizationsService.findAll(req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get(':id')
	findOne(@Param('id') id: string, @Req() req: AuthRequest) {
		return this.organizationsService.findOne(id, req.user.id);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Patch(':id')
	update(
		@Param('id') id: string,
		@Req() req: AuthRequest,
		@Body() updateOrganizationDto: UpdateOrganizationDto,
	) {
		return this.organizationsService.update(
			id,
			req.user.id,
			updateOrganizationDto,
		);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
	@Delete(':id')
	remove(@Param('id') id: string, @Req() req: AuthRequest) {
		return this.organizationsService.remove(id, req.user.id);
	}
}
