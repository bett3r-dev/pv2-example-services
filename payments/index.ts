import { PaymentCommands, PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
import { PaymentGatewaySystem } from './paymentGateway.system';
import { PaymentResultPolicy } from './paymentResult.policy';
import { PaymentsAggregate } from './payments.aggregate';
import { PaymentsSystem } from './payments.system';
import { PaymentStartedPolicy } from './paymentStarted.policy';

export function create(params: AppServiceParams) {
  const {serverComponents, u} = params;
  serverComponents.eventsourcing.routeCommandHandler(PaymentsSystem(params), PaymentCommands);
  // serverComponents.eventsourcing.routeCommandHandler(PaymentsAggregate(params), PaymentCommands);
  // serverComponents.eventsourcing.routeCommandHandler(PaymentGatewaySystem(params), PaymentCommands);
  // serverComponents.eventsourcing.routePolicy(PaymentStartedPolicy(params), PaymentEvents);
  // serverComponents.eventsourcing.routePolicy(PaymentResultPolicy(params), PaymentEvents);
}
