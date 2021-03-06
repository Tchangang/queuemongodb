import { DBRepoInterface } from '../Interface/DBDequeuer';
import { JobJSON } from '../Interface/Job';
declare class DBRepo implements DBRepoInterface {
    private isReady;
    private client;
    private collectionCursor;
    constructor(mongoUri: string, dbName: string, collectionName: string, expiredAt?: number);
    private waitUntilReady;
    private getCollection;
    deleteWithTypeAndCustomIdentifier(type: string, customIdentifier?: string): Promise<number>;
    add(toAdd: JobJSON): Promise<void>;
    getJob(customIdentifier: string | number): Promise<null | JobJSON>;
    checkForActionScheduled(type: string, customIdentifier: string | number): Promise<null | JobJSON>;
    dequeueJob(jobType: string, quantity: number): Promise<Array<JobJSON>>;
    update(toUpdateData: JobJSON): Promise<void>;
}
export default DBRepo;
