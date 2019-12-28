/// <reference types="node" />
import { EventEmitter } from 'events';
import { JobJSON } from './Interface/Job';
import Nullable from './Interface/Nullable';
import { DBDequeuerInterface, DBRepoInterface } from './Interface/DBDequeuer';
declare class DBDequeur implements DBDequeuerInterface {
    emitter: EventEmitter;
    mongoURI: string;
    dbName: string;
    collectionName: string;
    jobRetryDelay: number;
    maxRetry: number;
    refreshDelay: number;
    eventsList: {
        [K: string]: {
            max: number;
            current: 0;
        };
    };
    db: DBRepoInterface;
    timer: Nullable<NodeJS.Timeout>;
    static JobTypes: {
        maxRetry: string;
        dequeue: string;
    };
    constructor(params: {
        mongoURI: string;
        dbName: string;
        collectionName: string;
        jobRetryDelay?: number;
        maxRetry?: number;
        refreshDelay?: number;
        dbRepo?: DBRepoInterface;
    });
    private getNextJobs;
    stop(): void;
    add(jobType: string, data: any, scheduledAt?: number, customIdenfitier?: string | number): Promise<void>;
    private decreaseCurrentType;
    private increaseCurrentType;
    private complete;
    private requeue;
    on(eventType: string, max: number | undefined, callback: (job: JobJSON, complete: (successParams?: any) => Promise<void>, requeue: (failedParams?: any) => Promise<void>) => any): Promise<void>;
}
export = DBDequeur;
