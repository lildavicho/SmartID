import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionController } from './institution.controller';
import { InstitutionService } from './institution.service';
import { Institution, Campus } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Institution, Campus])],
  controllers: [InstitutionController],
  providers: [InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}
