import { EventEmitter } from 'events';
import {JobJSON} from './Interface/Job';
import Nullable from './Interface/Nullable';
import {DBDequeuerInterface, DBRepoInterface} from './Interface/DBDequeuer';
import DBRepo from './Repository/DBRepo';
import Job from './Entity/Job';
import {countActionsDoneSince, removeOldActionsDoneOlderThan} from './Repository/countDoneSinceDate';
import {getRateLimitFromStr} from './Repository/getRateLimitFromStr';

class DBDequeur implements DBDequeuerInterface{
    emitter: EventEmitter;
    mongoURI: string;
    dbName: string;
    collectionName: string;
    jobRetryDelay = 60000 * 60;
    maxRetry = 5;
    refreshDelay = 500;
    eventsList: {[K: string]: {
        max: number,
        current: number,
        maxOnPeriod: number,
        delay: number,
        lists: Array<number>,
    }};
    db: DBRepoInterface;
    timer: Nullable<NodeJS.Timeout>;
    static JobTypes = {
        maxRetry: 'MAX_RETRY',
        dequeue: 'DEQUEUE',
        resetPeriodCount: 'RESET_PERIOD_COUNT',
    };
    constructor(params: {
                    mongoURI: string,
                    dbName: string,
                    collectionName: string,
                    jobRetryDelay?: number,
                    maxRetry?: number,
                    refreshDelay?: number,
                    dbRepo?: DBRepoInterface,
                    jobShouldBeDeletedAfter?: number,
                }) {
        this.emitter = new EventEmitter();
        this.emitter.on(DBDequeur.JobTypes.dequeue, () => {
           this.getNextJobs();
           this.removeOldJob();
        });
        this.collectionName = params.collectionName;
        this.mongoURI = params.mongoURI;
        this.dbName = params.dbName;
        this.eventsList = {};
        if (params.maxRetry) {
            this.maxRetry = params.maxRetry;
        }
        if (params.jobRetryDelay) {
            this.jobRetryDelay = params.jobRetryDelay;
        }
        if (params.refreshDelay) {
            this.refreshDelay = params.refreshDelay;
        }
        if (!params.dbRepo) {
            this.db = new DBRepo(this.mongoURI, this.dbName, this.collectionName, );
        } else {
            this.db = params.dbRepo;
        }
        this.emitter.emit(DBDequeur.JobTypes.dequeue);
    }
    private removeOldJob() {
        const keys = Object.keys(this.eventsList);
        for (let i = 0; i < keys.length; i += 1) {
            if (this.eventsList[keys[i]] && this.eventsList[keys[i]].delay > 0) {
                const fromDate = new Date().getTime() - this.eventsList[keys[i]].delay;
                removeOldActionsDoneOlderThan(fromDate, this.eventsList[keys[i]].lists);
            }
        }
    }
    private getNextJobs() {
        this.timer = setTimeout(async () => {
            const keys = Object.keys(this.eventsList);
            const toExecute:Array<Promise<Array<JobJSON>>> = [];
            for (let i = 0; i < keys.length; i += 1) {
                let quantityDequeable = 0;
                if (this.eventsList[keys[i]].maxOnPeriod > 0 && this.eventsList[keys[i]].delay > 0) {
                    const fromDate = new Date().getTime() - this.eventsList[keys[i]].delay;
                    const actionsExecuted = countActionsDoneSince(fromDate, this.eventsList[keys[i]].lists);
                    quantityDequeable = Math.min(this.eventsList[keys[i]].max - this.eventsList[keys[i]].current,
                        this.eventsList[keys[i]].maxOnPeriod - actionsExecuted);
                } else {
                    quantityDequeable = this.eventsList[keys[i]].max - this.eventsList[keys[i]].current;
                }
                if (quantityDequeable > 0) {
                    toExecute.push(this.db.dequeueJob(keys[i], quantityDequeable));
                }
            }
            const promisesDone = await Promise.all(toExecute);
            promisesDone.map((items: Array<JobJSON>) => {
               items.map((item: JobJSON) => {
                   this.emitter.emit(item.type, item);
               });
            });
            clearTimeout(this.timer);
            this.timer = null;
            this.emitter.emit(DBDequeur.JobTypes.dequeue);
        }, this.refreshDelay);
    }
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    async add(jobType: string, data: any, scheduledAt?: number, customIdenfitier?: string | number, priority?: number): Promise<void> {
        const jobParams: {
            type: string,
            data: any,
            scheduledAt?: number,
            customIdentifier?: string | number,
            priority?: number,
        } = {
            type: jobType,
            data,
            priority: priority || 1,
        };
        if (typeof scheduledAt === 'number') {
            jobParams.scheduledAt = scheduledAt;
        }
        if (typeof customIdenfitier === 'string' || typeof customIdenfitier === 'number') {
            jobParams.customIdentifier = customIdenfitier;
        }
        const job = new Job(jobParams);
        await this.db.add(job);
    }
    private decreaseCurrentType(type: string, number = 1) {
        if (this.eventsList[type]) {
            this.eventsList[type].current -= number;
        }
    }
    private increaseCurrentType(type: string, number = 1) {
        if (this.eventsList[type]) {
            this.eventsList[type].current += number;
            this.eventsList[type].lists.push(new Date().getTime());
        }
    }
    private async complete(jobData: JobJSON, successParams: any) {
        delete jobData.doneAt;
        const job = new Job({
            id: jobData.id!,
            type: jobData.type,
            data: jobData.data,
            status: jobData.status,
            inProgress: jobData.inProgress,
            createdAt: jobData.createdAt,
            scheduledAt: jobData.scheduledAt,
            retry: jobData.retry,
            logs: jobData.logs,
            results: jobData.results,
        });
        job.complete(successParams);
        this.decreaseCurrentType(job.type);
        await this.db.update(job.json());
    }
    private async requeue(jobData: JobJSON, failedParams?: any) {
        const job = new Job({
            id: jobData.id!,
            type: jobData.type,
            data: jobData.data,
            status: jobData.status,
            inProgress: false,
            createdAt: jobData.createdAt,
            scheduledAt: jobData.scheduledAt,
            retry: jobData.retry,
            logs: jobData.logs,
        });
        this.decreaseCurrentType(job.type);
        job.reqeueue(this.jobRetryDelay, failedParams);
        if (job.retry >= this.maxRetry) {
            job.failed();
            await this.db.update(job.json());
            this.emitter.emit(DBDequeur.JobTypes.maxRetry, job);
            return;
        }
        await this.db.update(job.json());
    }
    async getAction(customIdentifier: string | number): Promise<Nullable<JobJSON>> {
        return this.db.getJob(customIdentifier);
    }
    async checkForActionScheduled(type: string, customIdentifier: string): Promise<Nullable<JobJSON>> {
        if (typeof type !== 'string' || type.length === 0) {
            return null;
        }
        if (typeof customIdentifier !== 'string' || customIdentifier.length === 0) {
            return null;
        }
        return this.db.checkForActionScheduled(type, customIdentifier);
    }
    on(eventType: string,
             max: number = 5,
             callback: (job: JobJSON, complete: (successParams?: any, results?: any) => Promise<void>,
                requeue: (failedParams?: any) => Promise<void>) => any,
             limit?: string): void {
        if (!this.eventsList[eventType]) {
            this.eventsList[eventType] = {
                max,
                current: 0,
                maxOnPeriod: 0,
                delay: 0,
                lists: [],
            };
            this.emitter.on(eventType, (jobToExecute: JobJSON) => {
                this.increaseCurrentType(jobToExecute.type);
                const complete = async (successParams?: any, results?: any) => {
                    await this.complete({ ...jobToExecute, results }, successParams);
                };
                const requeue = async (failedParams?: any) => {
                    await this.requeue(jobToExecute, failedParams);
                };
                try {
                    callback(jobToExecute, complete.bind(this), requeue.bind(this));
                } catch (e) {
                    this.requeue(jobToExecute)
                        .then(() => {});
                }
            });
            if (limit && typeof limit === 'string' && limit.length >= 4) {
                const rateLimit = getRateLimitFromStr(limit);
                if (rateLimit) {
                    this.eventsList[eventType].maxOnPeriod = rateLimit.maxOnPeriod;
                    if (rateLimit.delay > 0) {
                        this.eventsList[eventType].delay = rateLimit.delay;
                        this.emitter.emit(DBDequeur.JobTypes.resetPeriodCount, { event: eventType, delay: rateLimit.delay });
                    }
                }
            }
        }
    }
}
export = DBDequeur;

// 1) Pouvoir voir les jobs faits
// 2) Pouvoir voir les jobs en cours
// 3) Pouvoir voir les jobs à faire
