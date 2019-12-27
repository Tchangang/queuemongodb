import Nullable from './Nullable';

type JobLog = {
    createdAt: number,
    log: string,
};

type JobJSON = {
    id: Nullable<string>,
    type: string,
    available: boolean,
    data: Nullable<any>,
    status: | 'inqueue' | 'success' | 'failed',
    inProgress: boolean,
    createdAt: number,
    scheduledAt: number,
    retry: number,
    doneAt: Nullable<number>,
    customIdentifier: Nullable<string | number>,
    logs: Array<JobLog>,
}

export {
    JobJSON,
    JobLog,
}
