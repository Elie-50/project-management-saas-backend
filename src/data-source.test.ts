import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Organization } from './organizations/entities/organization.entity';

export const testDataSource = new DataSource({
	type: 'sqlite',
	database: ':memory:',
	dropSchema: true,
	entities: [User, Organization],
	synchronize: true,
});
