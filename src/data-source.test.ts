import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';

export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: [User],
  synchronize: true,
});
