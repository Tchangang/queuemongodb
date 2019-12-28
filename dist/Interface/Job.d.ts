import Nullable from './Nullable';
declare type JobLog = {
    createdAt: number;
    log: string;
};
declare type JobJSON = {
    id: Nullable<string>;
    type: string;
    available: boolean;
    data: Nullable<any>;
    status: 'inqueue' | 'success' | 'failed';
    inProgress: boolean;
    createdAt: number;
    scheduledAt: number;
    retry: number;
    doneAt: Nullable<number>;
    customIdentifier: Nullable<string | number>;
    logs: Array<JobLog>;
};
export { JobJSON, JobLog, };
