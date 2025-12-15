import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { ProjectsModule } from './projects/projects.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { StudentGroupsModule } from './student-groups/student-groups.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Role],
      synchronize: true,
      autoLoadEntities: true,
    }),
    RolesModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    InstitutionsModule,
    StudentGroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
