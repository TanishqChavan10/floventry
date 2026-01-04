import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { StockLot } from '../entities/stock-lot.entity';

export enum ExpiryStatus {
    OK = 'OK',
    EXPIRING_SOON = 'EXPIRING_SOON',
    EXPIRED = 'EXPIRED',
}

registerEnumType(ExpiryStatus, {
    name: 'ExpiryStatus',
    description: 'Expiry status of a stock lot',
});

@ObjectType()
export class StockLotWithStatus {
    @Field(() => StockLot)
    lot: StockLot;

    @Field(() => ExpiryStatus)
    status: ExpiryStatus;

    @Field(() => Int, { nullable: true })
    days_to_expiry?: number;
}

@ObjectType()
export class ExpiryWindow {
    @Field(() => Int)
    warning_days: number;
}
