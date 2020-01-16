import {JobJSON} from './Job';
import Nullable from './Nullable';

interface DBDequeuerInterface {
    add: (jobType: string, data: any) => Promise<void>,
    stop: () => void,
    on: (eventType: string, max: number, callback: (job: JobJSON, complete?: () => Promise<void>, requeue?: () => Promise<void>) => any) => Promise<void>,
    getAction: () => Promise<Nullable<JobJSON>>,
    // getNextJobs: () => Promise<void>,
}

interface DBRepoInterface {
    add: (toAdd: JobJSON) => Promise<void>,
    dequeueJob: (jobType: string, quantity: number) => Promise<Array<JobJSON>>,
    getJob: (customIdentifier: string) => Promise<Nullable<JobJSON>>,
    checkForActionScheduled: (jobType: string, customIdentifier: string | number) => Promise<Nullable<JobJSON>>,
    update: (toUpdate: JobJSON) => Promise<void>,
}

export {
    DBDequeuerInterface,
    DBRepoInterface,
};
