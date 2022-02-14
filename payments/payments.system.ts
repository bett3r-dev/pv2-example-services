import { Async, constant, isDefined } from '@bett3r-dev/crocks';
import { CartErrors, CartModel, PaymentCommands, PaymentEvents, PaymentModel } from '@bett3r-dev/pv2-example-domain';
import { Aggregate, createError, System } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';

export const PaymentsSystem = ({serverComponents, u, logger}: AppServiceParams) : System<Pick<typeof PaymentCommands, 'StartPayment' | 'ExternalGatewayWebhook'>> => {
  const {eventsourcing: {createEvent}, endpoint:{call}} = serverComponents;

  const externalGatewayMock = (paymentId: string) => {
    setTimeout(() => {
      const success = Math.floor(Math.random()*100) % 3 === 0 ? true: false;
      call('/payments-system/external-gateway-webhook', {method:'POST', body: {paymentId, success}})
        .fork(logger.error, () => {})
    }, 1000);
    return Async.of();
  }
    
  return ({
    name: 'PaymentsSystem',
    commandHandlers: {
      StartPayment: (data) =>
        call('/carts/:id', {params: {id: data.cartId}})
          .map(u.prop('state'))
          .chain(u.safeAsync(isDefined))
          .bimap(constant(createError(CartErrors.CartDoesNotExist, [data.cartId])), u.I)
          .chain((cart: CartModel) =>{
            return cart.products && Object.keys(cart.products).length
              ? externalGatewayMock(data.cartId)
                  .map(constant([createEvent(PaymentEvents.PaymentStarted, {cartId: data.cartId, cart, amount: u.getCartTotal(cart)})])) 
              : Async.Rejected(createError(CartErrors.EmptyCart, null))
          }),
      ExternalGatewayWebhook: (data) =>{
        return data.success 
          ? Async.of([createEvent(PaymentEvents.PaymentApproved, {cartId: data.paymentId})])
          : Async.of([createEvent(PaymentEvents.PaymentRejected, {cartId: data.paymentId, reason: 'Bad Luck'})])
      }
    }
  })
}
