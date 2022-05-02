import * as u from '@bett3r-dev/server-utils';
import * as ProfessionalEvents from 'src/domain/professional/professional.events';
import { createTestEnvironment, EventSourcingTest } from "src/serverComponents/eventsourcing/src/testing";
import { AppServiceParams } from 'src/types';
import { Professionals } from '../professionals.projectors';
import sinon from 'sinon';
import { assert } from 'chai';
import Async from '@bett3r-dev/crocks/Async';

const MongoStoreMock = (state = []) => ({
  read: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T) =>
    Async.of(state.filter(x => !Object.keys(filter).some((key) => filter[key] !== x[key])))
  ),
  upsert: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T, data: {$set: T}) => {
    const index = state.findIndex(x => !Object.keys(filter).some((key) => filter[key] !== x[key]));
    state[index >= 0 ? index : 0] = u.merge(state[index] || {}, {...data.$set, ...filter});
    return Async.of();
  })
})

describe( 'ProfessionalProjector', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams
  let mockState = [];
  const mongo = MongoStoreMock(mockState);
  const professional = {
    userId: "1470fbf9-d052-4a9e-bd57-b520f050c17c",
  }
 const personalDetails = {
    address: "address",
    phoneNumber: 12345,
    email: "email@email.com",
    name: "profesional nombre",
    country: "Tayikistan",
  }
 const professionalDetails = {
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

  it('Given no previous events, when  ProfessionalProfileCreated then ProfessionalProfile is upserted', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Professionals(params))
      .when(ProfessionalEvents.ProfessionalProfileCreated, professional, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...professional});
      })
      .fork(done, () => done())
  });

  it('Given ProfessionalProfileCreated, when ProfessionalPersonalDetailsUpserted then professional is updated', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Professionals(params))
      .given([
        es.createCommittedEvent(ProfessionalEvents.ProfessionalProfileCreated, professional, {id}),
      ])
      .when(ProfessionalEvents.ProfessionalPersonalDetailsUpserted, {...personalDetails}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...professional, personalDetails:{...personalDetails}});
        assert.deepNestedInclude(mockState[0], {personalDetails:{...personalDetails}});
      })
      .fork(done, () => done())
  });

  it('Given ProfessionalProfileCreated, when ProfessionalProfessionalDetailsUpserted then professional is updated', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Professionals(params))
      .given([
        es.createCommittedEvent(ProfessionalEvents.ProfessionalProfileCreated, professional, {id}),
      ])
      .when(ProfessionalEvents.ProfessionalProfessionalDetailsUpserted, {...professionalDetails}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...professional, professionalDetails:{...professionalDetails}});
        assert.deepNestedInclude(mockState[0], {professionalDetails:{...professionalDetails}});
      })
      .fork(done, () => done())
  });


});
