import { Container } from "inversify";
import { Socket } from "socket.io";

export interface IEventHandler {
    listen(socket: Socket): void;
}