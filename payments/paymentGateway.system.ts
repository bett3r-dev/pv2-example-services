import { Async } from '@bett3r-dev/crocks';
import { System } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { PaymentCommands, PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { PaymentResultPolicy } from './paymentResult.policy';

export const PaymentGatewaySystem = (serviceParams: AppServiceParams) : System<Pick<typeof PaymentCommands, 'Pay'>> => {
  const {serverComponents, u} = serviceParams;
  const {eventsourcing: {processEvent, createCommittedEvent}} = serverComponents;
  return ({
    name: 'PaymentGateway',
    commandHandlers: {
      /** 
       * Esta es una implementación ejemplo de una interacción con un external system, usualmente existirá un webhook a un http endpoint
       * o algún otro protocolo de comunicación. Es importante que se pasen los params que llegan al command handler como params al evento,
       * ya que ahi estan los correlation and causationId, que serán importantes luego para trazar las operaciones.
       */
      Pay: (data, params) =>
        Async((reject, resolve) => {
          setTimeout(() => {
            (Math.floor(Math.random()*100) % 3 === 0
              ? processEvent('PaymentResultPolicy')(createCommittedEvent(PaymentEvents.PaymentFailed, {cartId: data.cartId, reason: 'Bad Luck'}, params.query))
              : processEvent('PaymentResultPolicy')(createCommittedEvent(PaymentEvents.PaymentSucceeded, {cartId: data.cartId}, params.query))
            )
            .fork(reject, resolve)
          }, 500);
        }),
    }
  })
}
