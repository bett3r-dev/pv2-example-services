import { Async } from '@bett3r-dev/crocks';
import { CartCommands, PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { Policy } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { CartsAggregate } from './carts.aggregate';

export const PurchaseApprovedPolicy = (params: AppServiceParams) : Policy<Pick<typeof PaymentEvents, 'PaymentApproved'>> => {
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}} = serverComponents;

  return ({
    name: 'PurchaseApproved',
    commandHandler: CartsAggregate(params),
    eventHandlers: {
      PaymentApproved: (event) =>
          Async.of({
              id: event.data.cartId,
              command: createCommand(CartCommands.CloseCart, null)
          })
    }
  })
}