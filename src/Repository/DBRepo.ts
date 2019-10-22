import {Collection, Db, MongoClient, ObjectId} from 'mongodb';
import {DBRepoInterface} from '../Interface/DBDequeuer';
import {JobJSON} from '../Interface/Job';
import {setInterval} from 'timers';
import convertDataToJob from './JobDto';
import Nullable from '../Interface/Nullable';

class DBRepo implements DBRepoInterface {
    private isReady: boolean = false;
    private client: Nullable<Db>;
    private collectionCursor: Nullable<Collection>;
    constructor(mongoUri: string,
                dbName: string,
                collectionName: string) {
        MongoClient.connect(mongoUri, (err, client) => {
            this.client = client.db(dbName);
            this.collectionCursor = this.client.collection(collectionName);
            this.isReady = true;
        });
    }
    private async waitUntilReady(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isReady) {
                return resolve();
            }
            let cpt = 0;
            const timeoutCpt = Math.ceil(30000 / 200);
            let interval = setInterval(() => {
                if (this.isReady) {
                    clearInterval(interval);
                    return resolve();
                }
                cpt += 1;
                if (cpt > timeoutCpt) {
                    clearInterval(interval);
                    throw new Error('Unable to connect');
                }
            }, 200);
        });
    }
    private async getCollection(): Promise<Collection> {
        await this.waitUntilReady();
        if (!this.collectionCursor) {
            throw new Error('Database not ready. Call waitUntilReady method and retry.');
        }
        return this.collectionCursor;
    }
    async add(toAdd: JobJSON) {
        const toInsert = {
            ...toAdd,
        };
        delete toInsert.id;
        const collection = await this.getCollection();
        await collection.insertOne(toInsert);
    }
    async dequeueJob(jobType: string, quantity: number): Promise<Array<JobJSON>> {
        const collection = await this.getCollection();
        const toExecute = [];
        for (let i = 0; i < quantity; i += 1) {
            toExecute.push(collection.findOneAndUpdate({
                type: jobType,
                scheduledAt: { $lt: new Date().getTime() },
                inProgress: false,
                available: true,
            }, { $set: { inProgress: true } }, { sort: { _id: 1 }, returnOriginal: false }));
        }
        const found = await Promise.all(toExecute);
        const jobs: Array<JobJSON> = [];
        found.map((result) => {
            if (result && result.ok && result.value) {
                jobs.push(convertDataToJob(result.value));
            }
            return null;
        });
        return jobs;
    }
    async update(toUpdateData: JobJSON) {
        const collection = await this.getCollection();
        const toUpdate = {
            status: toUpdateData.status,
            logs: toUpdateData.logs,
            doneAt: toUpdateData.doneAt,
            inProgress: toUpdateData.inProgress,
            scheduledAt: toUpdateData.scheduledAt,
            retry: toUpdateData.retry,
            available: toUpdateData.available,
        };
        await collection.findOneAndUpdate({ _id: new ObjectId(toUpdateData.id!) }, { $set: toUpdate }, { returnOriginal: false });
    }
}

export default DBRepo;
