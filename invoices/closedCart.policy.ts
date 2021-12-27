import { Async } from '@bett3r-dev/crocks';
import { CartEvents, CartModel, InvoiceCommands, UserModel } from '@bett3r-dev/pv2-example-domain';
import { Policy } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { InvoicesAggregate } from './invoices.aggregate';

export const ClosedCartPolicy = (params: AppServiceParams) : Policy<Pick<typeof CartEvents, 'CartClosed'>> => {
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}, endpoint:{call}} = serverComponents;

  return ({
    name: 'ClosedCart',
    commandHandler: InvoicesAggregate(params),
    eventHandlers: {
      CartClosed: (event) =>
        Async.of((cart: CartModel) => (user: UserModel) => ({cart, user}))
          .ap(
            call('/carts/:id', {params: {id: event.metadata.id}})
              .map(u.prop('state'))
          )
          //FIXME: Buscar al usuario de verdad
          .ap(Async.of({address: 'Some Address'}))
          .map(({cart, user} :{cart: CartModel, user: UserModel}) => ({
            id: event.metadata.id,
            command: createCommand(InvoiceCommands.CreateInvoice, {
              userId: '09cb2c88-05cb-4e7f-a8af-5dc2fbc12425',//cart.userId,
              products: cart.products,
              address: user.address,
              total: u.getCartTotal(cart)
            })
          }))
    }
  })
}