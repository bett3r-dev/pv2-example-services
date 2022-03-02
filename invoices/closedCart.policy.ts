import { Async } from '@bett3r-dev/crocks';
import { CartEvents, CartModel, InvoiceCommands, UserModel } from '@bett3r-dev/pv2-example-domain';
import { Policy } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { InvoicesAggregate } from './invoices.aggregate';
import { CommittedEvent } from '../../serverComponents/core/src/interfaces/EventSourcing';

export const ClosedCartPolicy = (params: AppServiceParams) : Policy<Pick<typeof CartEvents, 'CartClosed'>> => {
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}, endpoint:{call}} = serverComponents;

  return ({
    name: 'ClosedCart',
    commandHandler: InvoicesAggregate(params),
    eventHandlers: {
      CartClosed: (event) =>{
        return call('/carts/:id', {params: {id: event.metadata.id}})
          .map(u.prop('state'))
          .chain((cart: CartModel) => call('/users/:id', {params: {id: cart.userId}})
            .map((user)=>({cart, user}))
          )
          .map(({cart, user} :{cart: CartModel, user: UserModel}) => ({
            id: event.metadata.id,
            command: createCommand(InvoiceCommands.CreateInvoice, { //TODO: no funciona, quizas fue lo que hicimos del method para los calls
              userId: cart.userId,
              products: cart.products,
              address: user.address,
              total: u.getCartTotal(cart)
            })
          }))
      }
    }
  })
}
