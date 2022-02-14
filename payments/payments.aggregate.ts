import { Async, constant, isDefined } from '@bett3r-dev/crocks';
import { CartErrors, CartModel, PaymentCommands, PaymentErrors, PaymentEvents, PaymentModel } from '@bett3r-dev/pv2-example-domain';
import { Aggregate, createError } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';

export const PaymentsAggregate = ({serverComponents, u}: AppServiceParams) : Aggregate<PaymentModel, Pick<typeof PaymentCommands, 'StartPayment' | 'ApprovePayment' | 'RejectPayment'>, Pick<typeof PaymentEvents, 'PaymentStarted' | 'PaymentApproved' | 'PaymentRejected'>> => {
  const {eventsourcing: {createEvent}, endpoint:{call}} = serverComponents;

  return ({
    name: 'Payments',
    eventReducers: {
      PaymentStarted: (state, data) => ({...state, ...data}),
      PaymentApproved: (state) => ({...state, status: 'approved'}),
      PaymentRejected: (state) => ({...state, status: 'rejected'}),
    },
    commandHandlers: {
      StartPayment: (state, data, {params}) =>
        call('/carts/:id', {params: {id: params.id}})
          .map(u.prop('state'))
          .chain(u.safeAsync(isDefined))
          .bimap(constant(createError(CartErrors.CartDoesNotExist, [params.id])), u.I)
          .chain((cart: CartModel) =>{
            return cart.products && Object.keys(cart.products).length
              ? Async.of({events:[createEvent(PaymentEvents.PaymentStarted, {cartId: params.id, cart, amount: u.getCartTotal(cart)})]})
              : Async.Rejected(createError(CartErrors.EmptyCart, null))
          }),
      ApprovePayment: (state, data, {params}) => {
        if(!state) return Async.Rejected(createError(PaymentErrors.PaymentNotStarted, [params.id]))
        return Async.of({events:[createEvent(PaymentEvents.PaymentApproved, {cartId: data.cartId})]})
      },
      RejectPayment: (state, data, {params}) => {
        if(!state) return Async.Rejected(createError(PaymentErrors.PaymentNotStarted, [params.id]))
        return Async.of({events:[createEvent(PaymentEvents.PaymentRejected, {cartId: data.cartId, reason: data.reason})]})
      }
    }
  })
}
