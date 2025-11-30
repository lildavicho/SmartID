import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NfcTag, NfcTagStatus } from '../entities/nfc-tag.entity';
import { CreateNfcTagDto } from '../dto/create-nfc-tag.dto';
import { UpdateNfcTagDto } from '../dto/update-nfc-tag.dto';

@Injectable()
export class NfcTagService {
  private readonly logger = new Logger(NfcTagService.name);

  constructor(
    @InjectRepository(NfcTag)
    private readonly nfcTagRepository: Repository<NfcTag>,
  ) {}

  async create(createNfcTagDto: CreateNfcTagDto): Promise<NfcTag> {
    const existingTag = await this.nfcTagRepository.findOne({
      where: { uid: createNfcTagDto.uid },
    });

    if (existingTag) {
      throw new ConflictException(`NFC tag with UID '${createNfcTagDto.uid}' already exists`);
    }

    const nfcTag = this.nfcTagRepository.create(createNfcTagDto);
    return this.nfcTagRepository.save(nfcTag);
  }

  async findAll(institutionId?: string): Promise<NfcTag[]> {
    const query = this.nfcTagRepository
      .createQueryBuilder('nfcTag')
      .leftJoinAndSelect('nfcTag.assignedToUser', 'user')
      .orderBy('nfcTag.createdAt', 'DESC');

    if (institutionId) {
      query.where('nfcTag.institutionId = :institutionId', { institutionId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<NfcTag> {
    const nfcTag = await this.nfcTagRepository.findOne({
      where: { id },
      relations: ['assignedToUser'],
    });

    if (!nfcTag) {
      throw new NotFoundException(`NFC tag with ID '${id}' not found`);
    }

    return nfcTag;
  }

  async findByUid(uid: string): Promise<NfcTag | null> {
    return this.nfcTagRepository.findOne({
      where: { uid },
      relations: ['assignedToUser'],
    });
  }

  async update(id: string, updateNfcTagDto: UpdateNfcTagDto): Promise<NfcTag> {
    const nfcTag = await this.findOne(id);

    if (updateNfcTagDto.uid && updateNfcTagDto.uid !== nfcTag.uid) {
      const existingTag = await this.nfcTagRepository.findOne({
        where: { uid: updateNfcTagDto.uid },
      });

      if (existingTag) {
        throw new ConflictException(`NFC tag with UID '${updateNfcTagDto.uid}' already exists`);
      }
    }

    Object.assign(nfcTag, updateNfcTagDto);
    return this.nfcTagRepository.save(nfcTag);
  }

  async remove(id: string): Promise<void> {
    const nfcTag = await this.findOne(id);
    await this.nfcTagRepository.remove(nfcTag);
  }

  async assignToUser(id: string, userId: string): Promise<NfcTag> {
    const nfcTag = await this.findOne(id);
    nfcTag.assignedToUserId = userId;
    return this.nfcTagRepository.save(nfcTag);
  }

  async unassignFromUser(id: string): Promise<NfcTag> {
    const nfcTag = await this.findOne(id);
    nfcTag.assignedToUserId = null;
    return this.nfcTagRepository.save(nfcTag);
  }

  async updateStatus(id: string, status: NfcTagStatus): Promise<NfcTag> {
    const nfcTag = await this.findOne(id);
    nfcTag.status = status;
    return this.nfcTagRepository.save(nfcTag);
  }

  async recordUsage(uid: string): Promise<NfcTag | null> {
    const nfcTag = await this.findByUid(uid);
    
    if (!nfcTag) {
      return null;
    }

    nfcTag.lastUsedAt = new Date();
    return this.nfcTagRepository.save(nfcTag);
  }
}

