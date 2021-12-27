import { PaymentEvents, ProductCommands } from '@bett3r-dev/pv2-example-domain';
import { Policy } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { ProductsAggregate } from './products.aggregate';

export const PaymentRejectedPolicy = (params: AppServiceParams) : Policy<typeof PaymentEvents> => {
  // TODO: Documentar que no se debe hacer nada en el espacio de esta función solo declaraciones.
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}, endpoint: {call}} = serverComponents;

  return ({
    name: 'PaymentRejected',
    commandHandler: ProductsAggregate(params),
    eventHandlers: {
      PaymentRejected: (event) =>
        call(`/carts/:id`, {params:{id: event.data.cartId}})
          .map(u.pathOr({}, ['state', 'products']))
          .map(Object.values)
          .map(u.map(({productId, quantity})=>({
            id: productId,
            command: createCommand(ProductCommands.RestoreStock, {cartId: event.data.cartId, quantity})
          })))
    }
  })
}
