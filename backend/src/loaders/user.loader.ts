import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { logLoaderBatch } from './loader.logger';

/** Maximum batch size to prevent huge IN queries */
const MAX_BATCH_SIZE = 100;

/**
 * Batch function: loads Users by their primary IDs.
 * No companyId filter needed — users are global entities.
 */
export function createUserLoader(
  userRepository: Repository<User>,
): DataLoader<string, User | null> {
  return new DataLoader<string, User | null>(
    async (ids: readonly string[]) => {
      const start = Date.now();
      const users = await userRepository.find({
        where: { id: In([...ids]) },
      });
      logLoaderBatch('UserLoader', ids.length, Date.now() - start);

      const userMap = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => userMap.get(id) ?? null);
    },
    { maxBatchSize: MAX_BATCH_SIZE, cache: true },
  );
}
