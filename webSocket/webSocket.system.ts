import { System } from "@bett3r-dev/server-core";
import { AppServiceParams } from "src/types";
import { WebSocketCommands } from ".";

export const WebSocket = ({serverComponents, u}: AppServiceParams) : System<typeof WebSocketCommands> => {
  const {webSocket, hook} = serverComponents;
  return ({
    name: "WebSocket",
    commandHandlers:{
      PublishMessage: webSocket.publish,
    },
  })
};

