import { AppDataSource } from "../datasource";
import { EntityTarget, Repository } from "typeorm";

export function getRepository<T>(entity: EntityTarget<T>): Repository<T> {
    const repo = AppDataSource.getRepository(entity);
    return repo;
}