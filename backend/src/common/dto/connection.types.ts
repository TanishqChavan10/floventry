import { Type } from '@nestjs/common';
import { ObjectType, Field } from '@nestjs/graphql';
import { CursorPageInfo } from './pagination.types';

/**
 * Generic factory to create Relay-style connection types.
 * Usage:
 *   const { Edge, Connection } = createConnectionTypes('Product', Product);
 */
export function createConnectionTypes<T>(
  name: string,
  NodeType: Type<T>,
) {
  @ObjectType(`${name}Edge`)
  class Edge {
    @Field(() => NodeType)
    node: T;

    @Field()
    cursor: string;
  }

  @ObjectType(`${name}Connection`)
  class Connection {
    @Field(() => [Edge])
    edges: Edge[];

    @Field(() => CursorPageInfo)
    pageInfo: CursorPageInfo;
  }

  return { Edge, Connection };
}
