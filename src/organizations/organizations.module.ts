import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Organization]),
		MembershipsModule,
		ProjectsModule,
	],
	controllers: [OrganizationsController],
	providers: [OrganizationsService],
})
export class OrganizationsModule {}
