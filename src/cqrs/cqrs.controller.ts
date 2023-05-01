import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReaderService } from './readModel/reader.service';

@Controller('cqrs')
export class CqrsController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly readerSrv: ReaderService,
  ) {}

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

  @Get(':context/:aggregate/:id')
  async query(
    @Param('context') context: string,
    @Param('aggregate') aggregate: string,
    @Param('id') id: string,
  ) {
    //implement reader service to get data from read model
    return {};
  }
}
