import * as u from '@bett3r-dev/server-utils';
import * as Events from 'src/domain/professionalSchedule/professionalSchedule.events';
import * as Commands  from "../../../domain/menu/professionalSchedule.commands";
import {createTestEnvironment,EventSourcingTest} from "src/serverComponents/eventsourcing/src/testing";
import {AppServiceParams} from 'src/types';
import {ProfessionalScheduleAggregate} from '../professionalSchedules.aggregate';

describe( 'professionalSchedule.aggregate', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams

  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {u, serverComponents: {eventsourcing: es}};
  })

  const event = {
      professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
      teamId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
      week: [
       {
        dayOfWeek: "monday",
        timeStart: 15,
        timeEnd: 20
       },
       {
        dayOfWeek: "friday",
        timeStart: 9,
        timeEnd: 16
       }
      ]
    }


  it('Given no previous events, when UpsertSchedule then ScheduleUpserted', done => {
    es.testAggregate(ProfessionalScheduleAggregate(params))
      .given()
      .when(Commands.UpsertSchedule,
        event
      )
      .then({
        events: [
          es.createCommittedEvent(
            Events.ScheduleUpserted,
            event
          )
        ],
        state: event
      })
      .fork(done, () => done());
  });


});
