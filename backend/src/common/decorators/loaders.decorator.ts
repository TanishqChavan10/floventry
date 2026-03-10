import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { DataLoaders } from '../../loaders/loader.types';

/**
 * Parameter decorator to extract DataLoaders from the GraphQL context.
 *
 * Usage in resolvers:
 * ```
 * @ResolveField()
 * async supplier(
 *   @Parent() product: Product,
 *   @Loaders() loaders: DataLoaders,
 * ) {
 *   return loaders.supplierLoader.load(product.supplier_id);
 * }
 * ```
 */
export const Loaders = createParamDecorator(
  (_data: unknown, context: ExecutionContext): DataLoaders => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().loaders;
  },
);
