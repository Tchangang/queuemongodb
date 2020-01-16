import Nullable from '../Interface/Nullable';
import { JobJSON, JobLog } from '../Interface/Job';
declare class Job {
    id: Nullable<string>;
    type: string;
    data: Nullable<any>;
    status: 'inqueue' | 'success' | 'failed';
    inProgress: boolean;
    createdAt: number;
    scheduledAt: number;
    retry: number;
    doneAt: Nullable<number>;
    available: boolean;
    logs: Array<JobLog>;
    results: any;
    customIdentifier: Nullable<string | number>;
    constructor(params: {
        id?: string;
        type?: string;
        data?: Nullable<any>;
        status?: 'inqueue' | 'success' | 'failed';
        inProgress?: boolean;
        createdAt?: number;
        scheduledAt?: number;
        retry?: number;
        doneAt?: number;
        available?: boolean;
        logs?: Array<JobLog>;
        customIdentifier?: string | number;
        results?: any;
    });
    json(): JobJSON;
    addLog(log: string): void;
    complete(successParams?: any): void;
    reqeueue(delay: number, failedParams?: any): void;
    failed(): void;
}
export default Job;
