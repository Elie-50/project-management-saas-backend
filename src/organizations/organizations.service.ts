import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrganizationsService {
	constructor(
		@InjectRepository(Organization)
		private readonly organizationsRepo: Repository<Organization>,
	) {}

	create(createOrganizationDto: CreateOrganizationDto, ownerId: string) {
		return this.organizationsRepo.save({
			...createOrganizationDto,
			owner: { id: ownerId } as User,
		});
	}

	findAll(ownerId: string) {
		return this.organizationsRepo.find({
			where: { owner: { id: ownerId } },
			order: { createdAt: 'DESC' },
		});
	}

	async findOne(id: string, ownerId: string): Promise<Organization> {
		const org = await this.organizationsRepo.findOne({
			where: { id, owner: { id: ownerId } },
		});

		if (!org) {
			throw new NotFoundException('Organization Not Found');
		}

		return org;
	}

	async update(
		id: string,
		ownerId: string,
		updateOrganizationDto: UpdateOrganizationDto,
	) {
		const organization: Organization = await this.findOne(id, ownerId);

		if (!updateOrganizationDto.name) {
			throw new BadRequestException('Name must be provided');
		}

		organization.name = updateOrganizationDto.name;

		return this.organizationsRepo.save(organization);
	}

	async remove(id: string, ownerId: string) {
		const existing = await this.findOne(id, ownerId);
		return this.organizationsRepo.remove(existing);
	}
}
