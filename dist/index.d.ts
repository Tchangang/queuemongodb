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
            current: number;
            maxOnPeriod: number;
            currentOnPeriod: number;
            limitReached: boolean;
        };
    };
    db: DBRepoInterface;
    timer: Nullable<NodeJS.Timeout>;
    static JobTypes: {
        maxRetry: string;
        dequeue: string;
        resetPeriodCount: string;
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
    private handleResetPeriodCount;
    private getNextJobs;
    stop(): void;
    add(jobType: string, data: any, scheduledAt?: number, customIdenfitier?: string | number): Promise<void>;
    private decreaseCurrentType;
    private increaseCurrentType;
    private complete;
    private requeue;
    getAction(customIdentifier: string | number): Promise<Nullable<JobJSON>>;
    checkForActionScheduled(type: string, customIdentifier: string): Promise<Nullable<JobJSON>>;
    on(eventType: string, max: number, callback: (job: JobJSON, complete: (successParams?: any, results?: any) => Promise<void>, requeue: (failedParams?: any) => Promise<void>) => any, limit?: string): Promise<void>;
}
export = DBDequeur;
