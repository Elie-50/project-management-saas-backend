import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Membership } from './entities/membership.entity';

@Module({
	imports: [TypeOrmModule.forFeature([User, Organization, Membership])],
	providers: [MembershipsService],
	exports: [MembershipsService],
})
export class MembershipsModule {}
