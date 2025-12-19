import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: Request & { user: User },
  ) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(
    @Req() req: Request & { user: User },
    @Query('search') search?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.projectsService.findAll(
      req.user,
      search,
      institutionId ? +institutionId : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: Request & { user: User },
  ) {
    return this.projectsService.update(+id, updateProjectDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invitation')
  generateInvitation(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ) {
    return this.projectsService.generateInvitation(+id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join/:token')
  joinProject(
    @Param('token') token: string,
    @Req() req: Request & { user: User },
  ) {
    return this.projectsService.joinProject(token, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/files')
  uploadFiles(
    @Param('id') id: string,
    @Body() files: { files: string[] },
    @Req() req: Request & { user: User },
  ) {
    return this.projectsService.uploadFiles(+id, files.files, req.user);
  }
}
