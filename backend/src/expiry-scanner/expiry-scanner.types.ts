import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExpiryScanStatus {
  @Field()
  enabled: boolean;

  @Field()
  jobRegistered: boolean;

  @Field()
  jobName: string;

  @Field()
  timeZone: string;

  @Field()
  cronExpression: string;

  @Field({ nullable: true })
  nextRunAt?: Date;

  @Field({ nullable: true })
  lastRunAt?: Date;

  @Field({ nullable: true })
  lastSuccessAt?: Date;

  @Field({ nullable: true })
  lastErrorAt?: Date;

  @Field({ nullable: true })
  lastErrorMessage?: string;
}

@ObjectType()
export class ExpiryScanResult {
  @Field()
  success: boolean;

  @Field()
  lotsScanned: number;

  @Field()
  message: string;
}
