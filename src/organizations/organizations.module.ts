import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
	imports: [TypeOrmModule.forFeature([Organization]), MembershipsModule],
	controllers: [OrganizationsController],
	providers: [OrganizationsService],
})
export class OrganizationsModule {}
