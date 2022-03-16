import { Async } from '@bett3r-dev/crocks';
import { PaymentCommands, PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { Policy } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { PaymentGatewaySystem } from './paymentGateway.system';

export const PaymentStartedPolicy = (params: AppServiceParams) : Policy<typeof PaymentEvents> => {
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}} = serverComponents;

  return ({
    name: 'PaymentStartedPolicy',
    commandHandler: PaymentGatewaySystem(params),
    eventHandlers: {
      PaymentStarted: (event) =>
          Async.of({
              id: event.metadata.id,
              command: createCommand(PaymentCommands.Pay, {cartId:event.data.cartId, amount: event.data.amount}) 
          })
    }
  })
}
