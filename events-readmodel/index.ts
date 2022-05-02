import { AppServiceParams } from 'src/types';
import { Events } from './events.projectors';
import Async from '@bett3r-dev/crocks/Async';
import { isNil } from '@bett3r-dev/crocks/predicates';
import { EndpointAction } from '../../serverComponents/core/src/interfaces/Endpoint';
import * as AppointmentEvents from 'src/domain/src/appointments/appointments.events';
import * as ProfessionalScheduleEvents from 'src/domain/src/professionalSchedules/professionalSchedules.events';
import * as ProfessionalBlockedTimeLapseEvents from 'src/domain/src/professionalBlockedTimeLapses/professionalBlockedTimeLapses.events';

//TODO: chequear todo esto

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeProjector(Events(params), {
    ...AppointmentEvents,
    ...ProfessionalScheduleEvents,
    ...ProfessionalBlockedTimeLapseEvents
  });
  serverComponents.endpoint.registerEndpoint({
    method: 'GET',
    module: 'events',
    route: 'events/readmodel/:id',
    name: 'events readmodel',
    description: 'get all events',
    isHttp: true,
    action: ({ body, query, params }) =>
      serverComponents.database.mongo.getCollection('events-projection').read({ ...query, ...params })
  });
  serverComponents.endpoint.registerEndpoint({
    method: 'GET',
    module: 'events',
    route: 'events/readmodel/patient/:patientId',
    name: 'events readmodel',
    description: 'get all events by given patientId',
    isHttp: true,
    action: ({ body, query, params }) => {
      return serverComponents.database.mongo.getCollection('events-projection').read({ ...query, ...params });
    }
  });
  // serverComponents.endpoint.registerEndpoint({
  //   method: 'POST',
  //   module: 'events',
  //   route: 'events/readmodel/availability',
  //   name: 'events readmodel',
  //   description: 'know availability of specified user',
  //   isPublic: true,
  //   action: (({body, query, params}) =>{
  //       Async.of(
  //           serverComponents.database.mongo
  //           .getCollection('events-projection')
  //           .read({
  //             $and:[
  //               {$or:[
  //                 {professionalId: body.professionalId},
  //                 {patientId: body.patientId}
  //               ]},
  //               {$or:[
  //                 {$and:[
  //                   {dateTimeStart:{$lte: body.dateTimeStart}},
  //                   {dateTimeEnd: {$gt: body.dateTimeStart}}
  //                 ]},
  //                 {$and:[
  //                   {dateTimeStart:{$gte: body.dateTimeStart}},
  //                   {dateTimeEnd: {$lte: body.dateTimeEnd}}
  //                 ]},
  //                 {$and:[
  //                   {dateTimeStart:{$lt: body.dateTimeEnd}},
  //                   {dateTimeEnd: {$gte: body.dateTimeEnd}}
  //                 ]}
  //               ]}
  //             ]
  //           })
  //         )
  //         }) as EndpointAction<{patientId: string, professionalId: string, dateTimeStart: Date, dateTimeEnd: Date}>
  // })
  serverComponents.endpoint.registerEndpoint({
    method: 'POST',
    module: 'events',
    route: 'events/readmodel/availability',
    name: 'events readmodel',
    description: 'know availability of specified user',
    isHttp: true,
    action: (({ body, query, params }) => {
      return Async.of((resAppointments) => (resSchedule) => {
        if(!resSchedule.length || resAppointments.length ) return false;
        const week = resSchedule[0].week;
        let isAvailable = false;
        let i = 0;
        const dateStart = new Date(body.dateTimeStart);
        const dateEnd = new Date(body.dateTimeEnd);
        // console.log(week[i].dayOfWeek, "==",  dateStart.getUTCDay())
        // console.log(week[i].hoursStart, "<=", dateStart.getUTCHours())
        // console.log(week[i].hoursEnd, ">=", dateEnd.getUTCHours())
        while(i < week?.length  && !isAvailable){
          if(week[i].dayOfWeek == dateStart.getUTCDay() && week[i].hoursStart <= dateStart.getUTCHours() && week[i].hoursEnd >= dateEnd.getUTCHours())
          {
            if(week[i].hoursStart == dateStart.getUTCHours()){
              // console.log('el schedule tiene un horario de entrada igual que la cita que pido')
              // console.log(week[i].minutesStart, "<=", dateStart.getUTCMinutes())
              if(week[i].minutesStart <= dateStart.getUTCMinutes()){
                isAvailable = true;
              }else{
                isAvailable = false;
              }
            }else if(week[i].hoursEnd == dateEnd.getUTCHours()){
              // console.log('el schedule tiene un horario de salida igual que la cita que pido')
              // console.log(week[i].minutesEnd, ">=", dateEnd.getUTCMinutes())
              if(week[i].minutesEnd >= dateEnd.getUTCMinutes()){
                isAvailable = true;
              }else{
                isAvailable = false;
              }
            }else{
              isAvailable = true;
            }
          }
          i++;
        }
        return isAvailable;
      })
        .ap(
          serverComponents.database.mongo.getCollection('events-projection').read({
            $and: [
              { $or: [{ professionalId: body.professionalId }, { patientId: body.patientId }] },
              {
                $or: [
                  {
                    $and: [
                      { dateTimeStart: { $lte: body.dateTimeStart } },
                      { dateTimeEnd: { $gt: body.dateTimeStart } }
                    ]
                  },
                  {
                    $and: [{ dateTimeStart: { $gte: body.dateTimeStart } }, { dateTimeEnd: { $lte: body.dateTimeEnd } }]
                  },
                  { $and: [{ dateTimeStart: { $lt: body.dateTimeEnd } }, { dateTimeEnd: { $gte: body.dateTimeEnd } }] }
                ]
              }
            ]
          })
        )
        .ap(
          serverComponents.database.mongo.getCollection('events-projection').read({
            $and: [{ professionalId: body.professionalId }, { type: 'schedule' }]
          })
        )
    }) as EndpointAction<{ patientId: string; professionalId: string; dateTimeStart: Date; dateTimeEnd: Date }>
  });
  // serverComponents.endpoint.registerEndpoint({
  //   method: 'GET',
  //   module: 'events',
  //   route: 'events/readmodel/:id?/:date?',
  //   name: 'events readmodel',
  //   description: 'Get all events for specified user from specified date',
  //   isPublic: true,
  //   action: (({body, query, params}) =>
  //     Async.of(serverComponents.database.mongo
  //       .getCollection('events-projection')
  //       .read({$and:{$or:{userId: params.id, professionalId:params.id}, $gte:{ dateTime: params.date }}})
  //     )
  // })
}
