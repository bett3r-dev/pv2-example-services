import * as u from '@bett3r-dev/server-utils';
import * as Events from 'src/domain/patient/patient.events';
import * as Commands  from "../../../domain/patient/patient.commands";
import {createTestEnvironment,EventSourcingTest} from "src/serverComponents/eventsourcing/src/testing";
import {AppServiceParams} from 'src/types';
import {PatientAggregate} from '../patients.aggregate';

describe( 'patient.aggregate', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams

  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {u, serverComponents: {eventsourcing: es}};
  })




  it('Given no previous events, when CreatePatientProfile then PatientProfileCreated', done => {
    es.testAggregate(PatientAggregate(params))
      .given()
      .when(Commands.CreatePatientProfile,
        {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' }
      )
      .then({
        events: [
          es.createCommittedEvent(
            Events.PatientProfileCreated,
            {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' }
          )
        ],
        state: {
          userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f',
          menuList: []
        }
      })
      .fork(done, () => done());
  });

  it('Given PatientProfileCreated, when UpsertPatientPersonalDetails then PatientPersonalDetailsUpserted', done => {

    es.testAggregate(PatientAggregate(params))
      .given([
        es.createEvent(Events.PatientProfileCreated, {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' })
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.UpsertPatientPersonalDetails, {
        address: 'address example',
        phoneNumber: 12345678,
        email: 'email@email.com',
      })
      .then({
        events: [
          es.createCommittedEvent( Events.PatientPersonalDetailsUpserted, {
            address: 'address example',
            phoneNumber: 12345678,
            email: 'email@email.com',
        })
        ],
        state: {
          userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f',
          menuList: [],
          personalDetails: {
            address: 'address example',
            phoneNumber: 12345678,
            email: 'email@email.com',
        }}
      })
      .fork(done, () => done());
  });


  it('Given PatientProfileCreated, when UpsertPatientMedicalInformation then PatientMedicalInformationUpserted', done => {
    es.testAggregate(PatientAggregate(params))
    .given([
      es.createEvent(Events.PatientProfileCreated, {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' })
    ], '280ebd03-954a-42ea-839d-4f071931974b')
    .when(Commands.UpsertPatientMedicalInformation, {})
    .then({
      events: [
        es.createCommittedEvent( Events.PatientMedicalInformationUpserted, {})
      ],
      state: {
        userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f',
        menuList: [],
        medicalInformation: {}
      }
    })
    .fork(done, () => done());
  });
  it('Given PatientProfileCreated, when UpsertPatientAnthropometricData then PatientAnthropometricDataUpserted', done => {
    es.testAggregate(PatientAggregate(params))
      .given([
        es.createEvent(Events.PatientProfileCreated, {userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f' })
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.UpsertPatientAnthropometricData, {
        weight: 80,
        height: 175,
      })
      .then({
        events: [
          es.createCommittedEvent( Events.PatientAnthropometricDataUpserted, {
              weight: 80,
              height: 175,
          })
        ],
        state: {
          userId: 'e7326414-d732-4aa0-b57f-fa4b800d5b7f',
          menuList: [],
          anthropometricData: {
            weight: 80,
            height: 175,
        }}
      })
      .fork(done, () => done());
  });

});
