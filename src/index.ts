import { EventEmitter } from 'events';
import {JobJSON} from './Interface/Job';
import Nullable from './Interface/Nullable';
import {DBDequeuerInterface, DBRepoInterface} from './Interface/DBDequeuer';
import DBRepo from './Repository/DBRepo';
import Job from './Entity/Job';

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
        currentOnPeriod: number,
        limitReached: boolean,
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
                }) {
        this.emitter = new EventEmitter();
        this.emitter.on(DBDequeur.JobTypes.dequeue, () => {
           this.getNextJobs();
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
            this.db = new DBRepo(this.mongoURI, this.dbName, this.collectionName);
        } else {
            this.db = params.dbRepo;
        }
        this.handleResetPeriodCount();
        this.emitter.emit(DBDequeur.JobTypes.dequeue);
    }
    private handleResetPeriodCount() {
        this.emitter.on(DBDequeur.JobTypes.resetPeriodCount, (args) => {
            if (typeof args === 'object' && args && Object(args).hasOwnProperty('event') && typeof args.event === 'string'
                && Object(args).hasOwnProperty('delay') && typeof args.delay === 'number') {
                const localTimeout = setTimeout(() => {
                    if (this.eventsList[args.event]) {
                        this.eventsList[args.event].currentOnPeriod = 0;
                        this.eventsList[args.event].limitReached = false;
                    }
                    clearTimeout(localTimeout);
                    this.emitter.emit(DBDequeur.JobTypes.resetPeriodCount, args);
                }, args.delay);
            }
        });
    }
    private getNextJobs() {
        this.timer = setTimeout(async () => {
            const keys = Object.keys(this.eventsList);
            const toExecute:Array<Promise<Array<JobJSON>>> = [];
            for (let i = 0; i < keys.length; i += 1) {
                let quantityDequeable = 0;
                if (this.eventsList[keys[i]].maxOnPeriod > 0) {
                    if (!this.eventsList[keys[i]].limitReached) {
                        quantityDequeable = Math.min(this.eventsList[keys[i]].max - this.eventsList[keys[i]].current,
                            this.eventsList[keys[i]].maxOnPeriod - this.eventsList[keys[i]].currentOnPeriod);
                    }
                } else {
                    quantityDequeable = this.eventsList[keys[i]].max - this.eventsList[keys[i]].current;
                }
                console.log(keys[i], quantityDequeable);
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
    async add(jobType: string, data: any, scheduledAt?: number, customIdenfitier?: string | number): Promise<void> {
        const jobParams: {
            type: string,
            data: any,
            scheduledAt?: number,
            customIdentifier?: string | number,
        } = {
            type: jobType,
            data,
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
            this.eventsList[type].currentOnPeriod += number;
            if (this.eventsList[type].currentOnPeriod >= this.eventsList[type].maxOnPeriod) {
                this.eventsList[type].limitReached = true;
            }
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
    async on(eventType: string,
             max: number = 5,
             callback: (job: JobJSON, complete: (successParams?: any, results?: any) => Promise<void>,
                requeue: (failedParams?: any) => Promise<void>) => any,
             limit?: string): Promise<void> {
        if (!this.eventsList[eventType]) {
            this.eventsList[eventType] = {
                max,
                current: 0,
                maxOnPeriod: 0,
                currentOnPeriod: 0,
                limitReached: false,
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
                const infos = limit.toLowerCase().split('/');
                const maxOnPeriod = (infos.length === 2 && parseInt(infos[0], 10)) || null;
                console.log('maxOnPeriod', maxOnPeriod);
                const delayNumber = (infos.length === 2 && infos[1].match(/\d+/g) && infos[1].match(/\d+/g)[0]
                    && parseInt(infos[1].match(/\d+/g)[0])) || 1;
                const delayType = (infos.length === 2 && infos[1].replace(/\d+/g, '').toLowerCase()) || null;
                console.log(maxOnPeriod);
                console.log(delayType);
                console.log(delayNumber);
                if (maxOnPeriod && delayNumber && delayType && ['second', 'minute', 'hour', 'day', 'week', 'month'].includes(delayType)) {
                    this.eventsList[eventType].maxOnPeriod = maxOnPeriod;
                    this.eventsList[eventType].currentOnPeriod = 0;
                    let delay = delayNumber;
                    switch (delayType) {
                        case 'second':
                            delay = delay * 1000;
                            break;
                        case 'minute':
                            delay = delay * 1000 * 60;
                            break;
                        case 'hour':
                            delay = delay * 1000 * 60 * 60;
                            break;
                        case 'day':
                            delay = delay * 1000 * 60 * 60 * 24;
                            break;
                        case 'week':
                            delay = delay * 1000 * 60 * 60 * 24 * 7;
                            break;
                        case 'month':
                            delay = delay * 1000 * 60 * 60 * 24 * 30;
                            break;
                        default:
                            delay = 0;
                            break;
                    }
                    if (delay > 0) {
                        this.emitter.emit(DBDequeur.JobTypes.resetPeriodCount, { event: eventType, delay });
                    }
                }
            }
        }
    }
}
export = DBDequeur;
