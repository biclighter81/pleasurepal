import { Injectable } from '@nestjs/common';
import { writeFileSync, readFileSync } from 'fs';
import { IEvent, IReducer } from '../types';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WriterService {
  constructor(private readonly emitter: EventEmitter2) {}

  async load<T>(aggName: string, id: string) {
    let data = '';
    try {
      data = readFileSync(`./${aggName}.json`, 'utf-8');
    } catch (error) {
      //if file does not exist, create it
      if (error.code === 'ENOENT') {
        writeFileSync(`./${aggName}.json`, '[]', 'utf-8');
        data = '[]';
      }
    }
    const json = JSON.parse(data) as (T & { id: string })[];
    return json.filter((x) => x.id === id);
  }

  async save(aggName: string, event: IEvent) {
    //append to file
    let data = '';
    try {
      data = readFileSync(`./${aggName}.json`, 'utf-8');
    } catch (error) {
      //if file does not exist, create it
      if (error.code === 'ENOENT') {
        writeFileSync(`./${aggName}.json`, '[]', 'utf-8');
        data = '[]';
      }
    }
    const json = JSON.parse(data);
    json.push(event);
    writeFileSync(`./${aggName}.json`, JSON.stringify(json), 'utf-8');
    //emit event to read model
    this.emitter.emit(event.name, event);
  }

  async getState<T extends IEvent>(
    aggName: string,
    id: string,
    reducer: IReducer<T>,
  ) {
    const events = await this.load<T>(aggName, id);
    if (!events.length) return null;
    let state = {};
    for (const event of events) {
      state = reducer.eventHandlers.get(event.name)(event, state);
    }
    return state;
  }
}
