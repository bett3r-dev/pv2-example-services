import { Async } from '@bett3r-dev/crocks';
import { PaymentEvents, ProductCommands } from '@bett3r-dev/pv2-example-domain';
import { Policy } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { ProductsAggregate } from './products.aggregate';

export const PaymentStartedPolicy = (params: AppServiceParams) : Policy<typeof PaymentEvents> => {
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}} = serverComponents;

  return ({
    name: 'PaymentStarted',
    commandHandler: ProductsAggregate(params),
    eventHandlers: {
      PaymentStarted: (event) =>
        Async.of(Object.values(event.data.cart.products))
          .map(u.map(({productId, quantity})=>({
            id: productId,
            command: createCommand(ProductCommands.DecreaseStock, {cartId: event.data.cartId, quantity})
          })))
    }
  })
}
