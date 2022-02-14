import { Async } from "@bett3r-dev/crocks";
import { System } from "@bett3r-dev/server-core";
import { AppServiceParams } from "src/types";
import { WebSocketCommands } from ".";

export const WebSocket = ({serverComponents, u}: AppServiceParams) : System<typeof WebSocketCommands> => {
  const {webSocket} = serverComponents;
  return ({
    name: "WebSocket",
    commandHandlers:{
      PublishMessage: (data) => {
        webSocket.publish(data);
        return Async.of();
      },
    },
  })
};

