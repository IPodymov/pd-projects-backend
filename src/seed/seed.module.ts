import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { InstitutionsModule } from '../institutions/institutions.module';
import { StudentGroupsModule } from '../student-groups/student-groups.module';
import { ProjectsModule } from '../projects/projects.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { StudentGroup } from '../student-groups/entities/student-group.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Institution, StudentGroup, Project]),
    UsersModule,
    RolesModule,
    InstitutionsModule,
    StudentGroupsModule,
    ProjectsModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
