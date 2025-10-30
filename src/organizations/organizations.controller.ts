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
import { MembershipsService } from '../memberships/memberships.service';
import { ProjectsService } from '../projects/projects.service';

interface AuthRequest extends Request {
	user: JwtPayload;
}

@Controller('api/organizations')
export class OrganizationsController {
	constructor(
		private readonly organizationsService: OrganizationsService,
		private readonly membershipService: MembershipsService,
		private readonly projectsService: ProjectsService,
	) {}

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

	@HttpCode(HttpStatus.CREATED)
	@UseGuards(AuthGuard)
	@Post(':orgId/members')
	addMember(@Param('orgId') orgId: string, @Body() body: { userId: string }) {
		return this.membershipService.create({ organizationId: orgId, ...body });
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get(':orgId/members')
	findAllMembers(@Param('orgId') orgId: string) {
		return this.membershipService.findAllMembers(orgId);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
	@Delete(':orgId/members/:userId')
	removeMember(@Param('orgId') orgId: string, @Param('userId') userId: string) {
		return this.membershipService.remove(orgId, userId);
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Get(':organizationId/projects')
	findAllProjects(
		@Req() req: AuthRequest,
		@Param('organizationId') organizationId: string,
	) {
		return this.projectsService.findAll(organizationId, req.user.id);
	}
}
