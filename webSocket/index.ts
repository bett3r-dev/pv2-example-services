import { InvoiceEvents, PaymentEvents } from "@bett3r-dev/pv2-example-domain";
import { Command, CommittedEvent } from "@bett3r-dev/server-core";
import { AppServiceParams } from 'src/types';
import { WebSocketPolicy } from "./webSocket.policy";
import { WebSocket } from './webSocket.system';

export const PublishMessage: Command<CommittedEvent> = () => ({
  name: 'PublishMessage',
  schema: null
})

export const WebSocketCommands = { PublishMessage }

export function create(params: AppServiceParams) {
  const {serverComponents: {eventsourcing}} = params;

  eventsourcing.routeCommandHandler(WebSocket(params), {PublishMessage});
  eventsourcing.routePolicy(WebSocketPolicy(params), Object.assign({}, PaymentEvents, InvoiceEvents));
}
