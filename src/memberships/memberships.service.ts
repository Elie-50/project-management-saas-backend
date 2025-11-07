import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

type OrganizationMember = {
	id: string;
	username: string;
	firstName: string;
	lastName: string;
	joinedAt: Date;
};

@Injectable()
export class MembershipsService {
	constructor(
		@InjectRepository(Membership)
		private readonly membershipRepo: Repository<Membership>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		@InjectRepository(Organization)
		private readonly organizationRepo: Repository<Organization>,
	) {}

	async create(dto: CreateMembershipDto) {
		const user = await this.userRepo.findOneByOrFail({ id: dto.userId });
		const organization = await this.organizationRepo.findOneByOrFail({
			id: dto.organizationId,
		});

		const membership = this.membershipRepo.create({
			user,
			organization,
		});

		return this.membershipRepo.save(membership);
	}

	async remove(organizationId: string, userId: string): Promise<void> {
		const result = await this.membershipRepo.delete({
			user: { id: userId },
			organization: { id: organizationId },
		});

		if (result.affected === 0) {
			throw new NotFoundException(`Membership not found`);
		}
	}

	async findAllMembers(orgId: string) {
		return this.membershipRepo
			.createQueryBuilder('membership')
			.innerJoin('membership.user', 'user')
			.where('membership.organization_id = :orgId', { orgId })
			.select([
				'user.id AS id',
				'user.username AS username',
				'user.firstName as "firstName"',
				'user.lastName as "lastName"',
				'membership.joinedAt as "joinedAt"',
			])
			.orderBy('membership.joinedAt', 'ASC')
			.getRawMany<OrganizationMember>();
	}

	async findAllMemberships(userId: string) {
		return this.membershipRepo.find({
			where: { user: { id: userId } },
			relations: ['organization'],
		});
	}
}
