import { InputType, Field, ObjectType, Int } from '@nestjs/graphql';
import { AuditAction, AuditEntityType } from '../enums/audit.enums';
import { CompanyAuditLog } from '../entities/company-audit-log.entity';

@InputType()
export class AuditLogFilterInput {
  @Field(() => AuditAction, { nullable: true })
  action?: AuditAction;

  @Field(() => AuditEntityType, { nullable: true })
  entityType?: AuditEntityType;

  @Field({ nullable: true })
  actorUserId?: string;

  @Field({ nullable: true })
  dateFrom?: Date;

  @Field({ nullable: true })
  dateTo?: Date;
}

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  limit?: number;
}

@ObjectType()
export class AuditLogPageInfo {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

@ObjectType()
export class AuditLogResponse {
  @Field(() => [CompanyAuditLog])
  items: CompanyAuditLog[];

  @Field(() => AuditLogPageInfo)
  pageInfo: AuditLogPageInfo;
}
