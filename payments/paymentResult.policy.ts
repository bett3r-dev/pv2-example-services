import { Async } from '@bett3r-dev/crocks';
import { Policy } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { PaymentCommands, PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { PaymentsAggregate } from './payments.aggregate';

export const PaymentResultPolicy = (params: AppServiceParams) : Policy<Pick<typeof PaymentEvents, 'PaymentSucceeded' | 'PaymentFailed'>> => {
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}} = serverComponents;

  return ({
    name: 'PaymentResult',
    commandHandler: PaymentsAggregate(params),
    eventHandlers: {
      PaymentSucceeded: (event) =>
        Async.of({
          id: event.data.cartId,
          command: createCommand(PaymentCommands.ApprovePayment, {cartId: event.data.cartId})
        }),
      PaymentFailed: (event) =>
          Async.of({
              id: event.data.cartId,
              command: createCommand(PaymentCommands.RejectPayment, {reason: event.data.reason, cartId: event.data.cartId})
          })

    }
  })
}
