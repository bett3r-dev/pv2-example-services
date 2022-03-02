import { constant, isNil } from '@bett3r-dev/crocks';
import { Aggregate, CommandHandlerResponse } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { InvoiceCommands, InvoiceEvents, InvoiceModel } from '@bett3r-dev/pv2-example-domain';

export const InvoicesAggregate = ({serverComponents, u}: AppServiceParams) : Aggregate<InvoiceModel, typeof InvoiceCommands, typeof InvoiceEvents> => {
  const {eventsourcing: {createEvent}} = serverComponents;
  return ({
    name: 'Invoices',
    eventReducers: {
      InvoiceCreated: (state, data) => ({...state, ...data}),
    },
    commandHandlers: {
      CreateInvoice: ({state}, data) =>
        u.safeAsync(isNil, state)
          .map<CommandHandlerResponse>(constant({events:[createEvent(InvoiceEvents.InvoiceCreated, data)]}))
          .coalesce(constant([]), u.I)
    }
  })
}
