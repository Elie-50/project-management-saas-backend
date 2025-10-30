import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { Membership } from '../memberships/entities/membership.entity';

@Injectable()
export class ProjectsService {
	constructor(
		@InjectRepository(Project)
		private readonly projectsRepository: Repository<Project>,
		@InjectRepository(Organization)
		private readonly organizationRepository: Repository<Organization>,
		@InjectRepository(Membership)
		private readonly membershipRepository: Repository<Membership>,
	) {}

	async create(createProjectDto: CreateProjectDto, userId: string) {
		const org = await this.organizationRepository.findOne({
			where: {
				id: createProjectDto.organizationId,
				owner: { id: userId },
			},
		});

		if (!org) {
			throw new ForbiddenException(
				'Cannot create projects for this organization',
			);
		}

		return this.projectsRepository.save(createProjectDto);
	}

	async findAll(organizationId: string, userId: string) {
		const allowed =
			(await this.membershipRepository.findOne({
				where: {
					organization: { id: organizationId },
					user: { id: userId },
				},
				select: ['id'],
			})) ||
			(await this.organizationRepository.findOne({
				where: {
					id: organizationId,
					owner: { id: userId },
				},
				select: ['id'],
			}));

		if (!allowed) {
			throw new ForbiddenException('Cannot see projects for this organization');
		}
		return this.projectsRepository.find({
			where: {
				organization: {
					id: organizationId,
				},
			},
		});
	}

	async findOne(id: string, userId: string) {
		const project = await this.projectsRepository.findOne({ where: { id } });

		if (!project) {
			throw new NotFoundException('Project not found');
		}

		const allowed =
			(await this.membershipRepository.findOne({
				where: {
					organization: { id: project?.organization?.id },
					user: { id: userId },
				},
				select: ['id'],
			})) ||
			(await this.organizationRepository.findOne({
				where: {
					id: project.organization?.id,
					owner: { id: userId },
				},
			}));

		if (!allowed) {
			throw new ForbiddenException('Cannot check this project');
		}

		return project;
	}

	async update(id: string, newName: string, userId: string) {
		const project = await this.findOne(id, userId);
		project.name = newName;
		return this.projectsRepository.save(project);
	}

	async remove(id: string, userId: string) {
		const project = await this.findOne(id, userId);

		return this.projectsRepository.remove(project);
	}
}
