import { DBRepoInterface } from '../Interface/DBDequeuer';
import { JobJSON } from '../Interface/Job';
declare class DBRepo implements DBRepoInterface {
    private isReady;
    private client;
    private collectionCursor;
    constructor(mongoUri: string, dbName: string, collectionName: string);
    private waitUntilReady;
    private getCollection;
    add(toAdd: JobJSON): Promise<void>;
    checkForActionScheduled(type: string, customIdentifier: string | number): Promise<{
        id: any;
        type: any;
        available: any;
        data: any;
        status: any;
        inProgress: any;
        createdAt: any;
        scheduledAt: any;
        retry: any;
        doneAt: any;
        customIdentifier: any;
        logs: any;
    } | null>;
    dequeueJob(jobType: string, quantity: number): Promise<Array<JobJSON>>;
    update(toUpdateData: JobJSON): Promise<void>;
}
export default DBRepo;
