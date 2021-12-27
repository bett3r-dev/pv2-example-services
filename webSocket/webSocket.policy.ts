import { Async } from "@bett3r-dev/crocks";
import { InvoiceEvents, PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { Policy } from "@bett3r-dev/server-core";
import { AppServiceParams } from 'src/types';
import { PublishMessage } from ".";
import { WebSocket } from './webSocket.system';

export const WebSocketPolicy = (params: AppServiceParams): Policy<typeof PaymentEvents & typeof InvoiceEvents> => {
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}} = serverComponents;

  const handleEvent = (event) =>{
    return Async.of({
      id: event.metadata.id,
      command: createCommand(PublishMessage, event)
    })
  };

  return ({
    name: "WebSocket",
    commandHandler: WebSocket(params),
    eventHandlers:{
     PaymentApproved: handleEvent,
     PaymentRejected: handleEvent,
     InvoiceCreated: handleEvent
    }
  })
};
