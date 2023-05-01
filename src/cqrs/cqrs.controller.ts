import { Body, Controller, HttpException, Param, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('cqrs')
export class CqrsController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Post(':context/:aggregate/:command')
  async command(
    @Param('context') context: string,
    @Param('aggregate') aggregate: string,
    @Param('command') command: string,
    @Body() payload: any,
  ) {
    const commandName = `${context}.${aggregate}.${command}`;
    if (!this.eventEmitter.hasListeners(commandName)) {
      throw new HttpException(`Command ${commandName} does not exist`, 404);
    }
    this.eventEmitter.emit(commandName, payload);
    let result;
    try {
      result = await new Promise((resolve, reject) => {
        this.eventEmitter.on(`${commandName}.success`, (data) => {
          resolve(data);
        });
        this.eventEmitter.on(`${commandName}.error`, (data) => {
          reject({
            message: `Command ${commandName} failed! ${data.message}`,
            data,
          });
        });
      });
    } catch (error) {
      throw new HttpException(error, 400);
    }
    return result;
  }
}
