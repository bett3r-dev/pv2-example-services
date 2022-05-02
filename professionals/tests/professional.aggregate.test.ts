import * as u from '@bett3r-dev/server-utils';
import * as Events from 'src/domain/professional/professional.events';
import * as Commands  from "../../../domain/professional/professional.commands";
import {createTestEnvironment,EventSourcingTest} from "src/serverComponents/eventsourcing/src/testing";
import {AppServiceParams} from 'src/types';
import {ProfessionalAggregate} from '../professionals.aggregate';

describe( 'professional.aggregate', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams

  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {u, serverComponents: {eventsourcing: es}};
  })




  it('Given no previous events, when CreateProfessionalProfile then ProfessionalProfileCreated', done => {
    es.testAggregate(ProfessionalAggregate(params))
      .given()
      .when(Commands.CreateProfessionalProfile,
        {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' }
      )
      .then({
        events: [
          es.createCommittedEvent(
            Events.ProfessionalProfileCreated,
            {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' }
          )
        ],
        state: {
          userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f'
        }
      })
      .fork(done, () => done());
  });

  it('Given ProfessionalProfileCreated, when UpsertProfessionalPersonalDetails then ProfessionalPersonalDetailsUpserted', done => {

    es.testAggregate(ProfessionalAggregate(params))
      .given([
        es.createEvent(Events.ProfessionalProfileCreated, {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' })
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.UpsertProfessionalPersonalDetails, {
        address: 'address example',
        phoneNumber: 12345678,
        email: 'email@email.com',
        name: 'profesional',
        country: 'Argentina',
      })
      .then({
        events: [
          es.createCommittedEvent( Events.ProfessionalPersonalDetailsUpserted, {
              address: 'address example',
              phoneNumber: 12345678,
              email: 'email@email.com',
              name: 'profesional',
              country: 'Argentina',
            })
        ],
        state: {
          userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f',
          personalDetails: {
            address: 'address example',
            phoneNumber: 12345678,
            email: 'email@email.com',
            name: 'profesional',
            country: 'Argentina',
          }}
      })
      .fork(done, () => done());
  });


  it('Given ProfessionalProfileCreated, when UpsertProfessionalProfessionalDetails then ProfessionalProfessionalDetailsUpserted', done => {
    es.testAggregate(ProfessionalAggregate(params))
    .given([
      es.createEvent(Events.ProfessionalProfileCreated, {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' })
    ], '280ebd03-954a-42ea-839d-4f071931974b')
    .when(Commands.UpsertProfessionalProfessionalDetails, {})
    .then({
      events: [
        es.createCommittedEvent( Events.ProfessionalProfessionalDetailsUpserted, {})
      ],
      state: {
        userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f',
        professionalDetails: {}
      }
    })
    .fork(done, () => done());
  });


});
