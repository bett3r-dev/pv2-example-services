import * as u from '@bett3r-dev/server-utils';
import * as Events from 'src/domain/menu/menu.events';
import * as Commands  from "../../../domain/menu/menu.commands";
import {createTestEnvironment,EventSourcingTest} from "src/serverComponents/eventsourcing/src/testing";
import {AppServiceParams} from 'src/types';
import {MenuAggregate} from '../menu.aggregate';

describe( 'menu.aggregate', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams

  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {u, serverComponents: {eventsourcing: es}};
  })


  it('Given no previous events, when CreateMenu then MenuCreated', done => {
    es.testAggregate(MenuAggregate(params))
      .given()
      .when(Commands.CreateMenu,
        {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c'}
      )
      .then({
        events: [
          es.createCommittedEvent(
            Events.MenuCreated,
            {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c'}
          )
        ],
        state: {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c'}
      })
      .fork(done, () => done());
  });
  it('Given MenuCreated, when UpdateMenu then MenuUpdated', done => {
    es.testAggregate(MenuAggregate(params))
      .given([es.createEvent(Events.MenuCreated, {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c'})], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.UpdateMenu,
        {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17b'}
      )
      .then({
        events: [
          es.createCommittedEvent(
            Events.MenuUpdated,
            {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17b'}
          )
        ],
        state: {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17b'}
      })
      .fork(done, () => done());
  });
  // it('Given MenuCreated, when AssignMenu then MenuAssigned', done => {
  //   es.testAggregate(MenuAggregate(params))
  //     .given([es.createEvent(Events.MenuCreated, {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c'})], '280ebd03-954a-42ea-839d-4f071931974b')
  //     .when(Commands.AssignMenu,
  //       {}
  //     )
  //     .then({
  //       events: [
  //         es.createCommittedEvent(
  //           Events.MenuAssigned,
  //           {}
  //         )
  //       ],
  //       state: {professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c'}
  //     })
  //     .fork(done, () => done());
  // });

});
