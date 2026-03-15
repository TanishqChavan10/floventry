import { InputType, ObjectType, Field, Int } from '@nestjs/graphql';

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  limit?: number;

  @Field({ nullable: true })
  search?: string;
}

@ObjectType()
export class PageInfo {
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

// ── Cursor-based pagination ──

@InputType()
export class CursorPaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  first?: number;

  @Field({ nullable: true })
  after?: string;

  @Field({ nullable: true })
  search?: string;
}

@ObjectType()
export class CursorPageInfo {
  @Field()
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;

  @Field(() => Int)
  totalCount: number;
}

// Helpers for encoding/decoding cursors from offsets
export function encodeCursor(offset: number): string {
  return Buffer.from(`cursor:${offset}`).toString('base64');
}

export function decodeCursor(cursor: string): number {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  const match = decoded.match(/^cursor:(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}
