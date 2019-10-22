import Nullable from '../Interface/Nullable';
import {JobJSON, JobLog} from '../Interface/Job';

class Job {
    id: Nullable<string>;
    type: string = '';
    data: Nullable<any>;
    status: | 'inqueue' | 'success' | 'failed' = 'inqueue';
    inProgress = false;
    createdAt = new Date().getTime();
    scheduledAt = new Date().getTime();
    retry: number = 0;
    doneAt: Nullable<number>;
    available = true;
    logs: Array<JobLog> = [];
    constructor(params: {
        id?: string,
        type?: string,
        data?: Nullable<any>,
        status?: | 'inqueue' | 'success' | 'failed',
        inProgress?: boolean,
        createdAt?: number,
        scheduledAt?: number,
        retry?: number,
        doneAt?: number,
        available?: boolean,
        logs?: Array<JobLog>,
    }) {
        if (params.id) {
            this.id = params.id;
        }
        this.type = params.type || '';
        if (params.data) {
            this.data = params.data;
        }
        if (params.status) {
            this.status = params.status;
        }
        if (params.inProgress) {
            this.inProgress = params.inProgress;
        }
        if (params.createdAt) {
            this.createdAt = params.createdAt;
        }
        if (params.scheduledAt) {
            this.scheduledAt = params.scheduledAt;
        }
        if (params.retry) {
            this.retry = params.retry;
        }
        if (params.doneAt) {
            this.doneAt = params.doneAt;
        }
        if (params.logs) {
            this.logs = params.logs;
        }
        if (typeof params.available === 'boolean') {
            this.available = params.available;
        }
    }
    json(): JobJSON {
        return {
            id: this.id,
            available: this.available,
            type: this.type,
            data: this.data,
            status: this.status,
            inProgress: this.inProgress,
            createdAt: this.createdAt,
            scheduledAt: this.scheduledAt,
            retry: this.retry,
            doneAt: this.doneAt,
            logs: this.logs,
        };
    }
    addLog(log: string) {
        this.logs.push({ createdAt: new Date().getTime(), log });
    }
    complete(successParams?: any) {
        this.status = 'success';
        this.doneAt = new Date().getTime();
        this.available = false;
        this.inProgress = false;
        if (typeof successParams !== 'undefined') {
            this.addLog('Job done successfully at '.concat(new Date().toString()).concat(' with answer: ').concat(JSON.stringify(successParams || {})));
        } else {
            this.addLog('Job done successfully at '.concat(new Date().toString()));
        }
    }
    reqeueue(delay: number, failedParams?: any) {
        this.status = 'failed';
        this.retry += 1;
        this.inProgress = false;
        this.available = true;
        this.scheduledAt = new Date().getTime() + delay;
        if (typeof failedParams !== 'undefined') {
            this.addLog('Job failed for'.concat(this.retry.toString()).concat(' time at ').concat(new Date().toString()).concat(' with answer: ').concat(JSON.stringify(failedParams || {})));
        } else {
            this.addLog('Job failed for'.concat(this.retry.toString()).concat(' time at ').concat(new Date().toString()));
        }
    }
    failed() {
        this.status = 'failed';
        this.inProgress = false;
        this.available = false;
        this.addLog('Job totally failed for'.concat(this.retry.toString()).concat(' time at ').concat(new Date().toString()));
    }
}

export default Job;
