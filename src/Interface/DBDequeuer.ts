import {JobJSON} from './Job';

interface DBDequeuerInterface {
    add: (jobType: string, data: any) => Promise<void>,
    stop: () => void,
    on: (eventType: string, max: number, callback: (job: JobJSON, complete?: () => Promise<void>, requeue?: () => Promise<void>) => any) => Promise<void>,
}

interface DBRepoInterface {
    add: (toAdd: JobJSON) => Promise<void>,
    dequeueJob: (jobType: string, quantity: number) => Promise<Array<JobJSON>>,
    update: (toUpdate: JobJSON) => Promise<void>,
}

export {
    DBDequeuerInterface,
    DBRepoInterface,
};
