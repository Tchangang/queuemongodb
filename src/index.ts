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
        current: 0,
    }};
    db: DBRepoInterface;
    timer: Nullable<NodeJS.Timeout>;
    static JobTypes = {
        maxRetry: 'MAX_RETRY',
        dequeue: 'DEQUEUE',
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
        this.getNextJobs();
        if (!params.dbRepo) {
            this.db = new DBRepo(this.mongoURI, this.dbName, this.collectionName);
        } else {
            this.db = params.dbRepo;
        }
    }
    private getNextJobs() {
        this.timer = setTimeout(async () => {
            const keys = Object.keys(this.eventsList);
            const toExecute:Array<Promise<Array<JobJSON>>> = [];
            for (let i = 0; i < keys.length; i += 1) {
                const quantityDequeable = this.eventsList[keys[i]].max - this.eventsList[keys[i]].current;
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
            this.emitter.emit(DBDequeur.JobTypes.dequeue);
            this.timer = null;
        }, this.refreshDelay);
    }
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    async add(jobType: string, data: any): Promise<void> {
        const job = new Job({
            type: jobType,
            data,
        });
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
            inProgress: jobData.inProgress,
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
    async on(eventType: string,
             max: number = 5,
             callback: (job: JobJSON, complete?: (successParams?: any) => Promise<void>, requeue?: (failedParams?: any) => Promise<void>) => any): Promise<void> {
        if (!this.eventsList[eventType]) {
            this.eventsList[eventType] = {
                max: 0,
                current: 0,
            };
            this.emitter.on(eventType, (jobToExecute) => {
                this.increaseCurrentType(jobToExecute.type);
                const complete = async (successParams?: any) => {
                    await this.complete(jobToExecute.id, successParams);
                };
                const requeue = async (failedParams?: any) => {
                    await this.requeue(jobToExecute.id, failedParams);
                };
                try {
                    callback(jobToExecute, complete.bind(this), requeue.bind(this));
                } catch (e) {
                    this.requeue(jobToExecute)
                        .then(() => {});
                }
            });
        }
    }
}

export default DBDequeur;
