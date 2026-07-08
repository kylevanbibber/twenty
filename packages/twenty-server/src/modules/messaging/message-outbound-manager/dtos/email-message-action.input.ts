import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class EmailMessageActionInput {
  @Field(() => String)
  connectedAccountId: string;

  @Field(() => String, { nullable: true })
  messageExternalId?: string;

  @Field(() => String, { nullable: true })
  threadExternalId?: string;

  @Field(() => String)
  action: 'ARCHIVE' | 'TRASH' | 'DELETE' | 'MOVE';

  @Field(() => String, { nullable: true })
  targetLabelId?: string;
}
