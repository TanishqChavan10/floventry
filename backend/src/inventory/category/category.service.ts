import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  async create(
    createCategoryInput: CreateCategoryInput,
    userId: string,
  ): Promise<Category> {
    if (createCategoryInput.parentId) {
      const parent = await this.findOne(createCategoryInput.parentId, userId);
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${createCategoryInput.parentId} not found`,
        );
      }
    }

    const category = this.categoryRepository.create({
      ...createCategoryInput,
      userId, // Set the owner
    });
    return await this.categoryRepository.save(category);
  }

  async findAll(userId: string): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { userId }, // Filter by user
      relations: ['products', 'parent', 'children'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllSimple(userId: string): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { userId }, // Filter by user
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: number, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { category_id: id, userId }, // Filter by user
      relations: ['products', 'parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateCategoryInput: UpdateCategoryInput,
    userId: string,
  ): Promise<Category> {
    const category = await this.findOne(id, userId);

    if (updateCategoryInput.parentId) {
      // Prevent circular dependency: parent cannot be itself
      if (updateCategoryInput.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parent = await this.findOne(updateCategoryInput.parentId, userId);
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${updateCategoryInput.parentId} not found`,
        );
      }
    }

    Object.assign(category, updateCategoryInput);
    return await this.categoryRepository.save(category);
  }

  async remove(id: number, userId: string): Promise<boolean> {
    const category = await this.findOne(id, userId);
    await this.categoryRepository.remove(category);
    return true;
  }

  async findByName(name: string, userId: string): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { name: name, userId }, // Filter by user
      relations: ['products'],
    });
  }

  async searchByName(searchTerm: string, userId: string): Promise<Category[]> {
    return await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.name ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      })
      .andWhere('category.userId = :userId', { userId }) // Filter by user
      .leftJoinAndSelect('category.products', 'products')
      .getMany();
  }
}
