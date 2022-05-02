import * as u from '@bett3r-dev/server-utils';
import * as PatientEvents from 'src/domain/patient/patient.events';
import { createTestEnvironment, EventSourcingTest } from "src/serverComponents/eventsourcing/src/testing";
import { AppServiceParams } from 'src/types';
import { Patients } from '../patients.projectors';
import sinon from 'sinon';
import { assert } from 'chai';
import Async from '@bett3r-dev/crocks/Async';
import { PersonalDetails, AnthropometricData } from '../../../domain/patient/patient.model';

//TODO: ESTO CENTRALIZAR
const MongoStoreMock = (state = []) => ({
  read: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T) =>
    Async.of(state.filter(x => !Object.keys(filter).some((key) => filter[key] !== x[key])))
  ),
  upsert: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T, data: {$set?: T, $addToSet?: T}) => {
    const index = state.findIndex(x => !Object.keys(filter).some((key) => filter[key] !== x[key]));
    state[index >= 0 ? index : 0] = u.merge(state[index] || {}, {...data.$set, ...data.$addToSet, ...filter});
    return Async.of();
  })
})

describe( 'PatientProjector', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams
  let mockState = [];
  const mongo = MongoStoreMock(mockState);
  const patient = {
    userId: "1470fbf9-d052-4a9e-bd57-b520f050c17c",
  }
 const personalDetails = {
    address: "address",
    phoneNumber: 12345,
    email: "email@email.com",
  }
 const medicalInformation = {
  }
 const anthropometricData = {
    weight: 80,
    height: 175,
  }
  const patientMenu ={
    professionalId: "1470fbf9-d052-4a9e-bd57-b520f050c17c",
    menuId: "512cf4ca-e2d3-4393-b01c-435b060fc6b0"
  }

  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {
      u,
      serverComponents: {
        eventsourcing: es,
        database:{
          //@ts-ignore
          mongo: {getCollection: () => mongo}
        }
      }
    };
  })

  afterEach(() => {
    sinon.resetHistory();
    mockState.splice(0);
  })

  it('Given no previous events, when  PatientProfileCreated then PatientProfile is upserted', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Patients(params))
      .when(PatientEvents.PatientProfileCreated, patient, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...patient});
      })
      .fork(done, () => done())
  });

  it('Given PatientProfileCreated, when PatientPersonalDetailsUpserted then patient is updated', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Patients(params))
      .given([
        es.createCommittedEvent(PatientEvents.PatientProfileCreated, patient, {id}),
      ])
      .when(PatientEvents.PatientPersonalDetailsUpserted, {...personalDetails}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...patient, personalDetails:{...personalDetails}});
      })
      .fork(done, () => done())
  });
  it('Given PatientProfileCreated, when PatientMedicalInformationUpserted then patient is updated', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Patients(params))
      .given([
        es.createCommittedEvent(PatientEvents.PatientProfileCreated, patient, {id}),
      ])
      .when(PatientEvents.PatientMedicalInformationUpserted, {...medicalInformation}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...patient, medicalInformation:{...medicalInformation}});
      })
      .fork(done, () => done())
  });
  it('Given PatientProfileCreated, when PatientAnthropometricDataUpserted then patient is updated', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Patients(params))
      .given([
        es.createCommittedEvent(PatientEvents.PatientProfileCreated, patient, {id}),
      ])
      .when(PatientEvents.PatientAnthropometricDataUpserted, {...anthropometricData}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], { ...patient, anthropometricData:{...anthropometricData}});
      })
      .fork(done, () => done())
  });
  it('Given PatientProfileCreated, when MenuAssigned then patient is updated', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Patients(params))
      .given([
        es.createCommittedEvent(PatientEvents.PatientProfileCreated,patient, {id}),
      ])
      .when(PatientEvents.MenuAssigned, patientMenu, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...patient, assignedMenu:patientMenu});
      })
      .fork(done, () => done())
  });

});
