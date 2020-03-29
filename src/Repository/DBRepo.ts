import {Collection, Db, MongoClient, ObjectId} from 'mongodb';
import {DBRepoInterface} from '../Interface/DBDequeuer';
import {JobJSON} from '../Interface/Job';
import {setInterval} from 'timers';
import convertDataToJob from './JobDto';
import Nullable from '../Interface/Nullable';

let clients: {[k: string]: MongoClient} = {};

class DBRepo implements DBRepoInterface {
    private isReady: boolean = false;
    private client: Nullable<Db>;
    private collectionCursor: Nullable<Collection>;
    constructor(mongoUri: string,
                dbName: string,
                collectionName: string,
                expiredAt?: number) {
        if (!mongoUri) {
            throw new Error('Missing mongoUri');
        }
        if (!dbName) {
            throw new Error('Missing dbName');
        }
        if (!collectionName) {
            throw new Error('Missing collectionName');
        }
        const identifier = `${mongoUri}-${dbName}-${collectionName}`;
        if (clients[identifier]) {
            this.client = clients[identifier].db(dbName);
            this.collectionCursor = this.client.collection(collectionName);
            this.isReady = true;
        } else {
            MongoClient.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }, (err, client) => {
                clients[identifier] = client;
                this.client = client.db(dbName);
                this.collectionCursor = this.client.collection(collectionName);
                this.collectionCursor.indexes()
                    .then((indexes) => {
                        const createdAtIndex = indexes.filter(index => index && index.name === 'createdAtExpired')[0];
                        console.log('createdATINDEX', createdAtIndex);
                        if (!createdAtIndex) {
                            return this.collectionCursor.createIndex({ createdAt: -1 },
                               { expireAfterSeconds: expiredAt || 3600 * 48, name: 'createdAtExpired' });
                        }
                        if (expiredAt && createdAtIndex.expireAfterSeconds !== expiredAt) {
                            return this.client.command({ collMod: collectionName,
                                index: { keyPattern: { createdAt: -1 },
                                    expireAfterSeconds: expiredAt,
                                },
                            });
                        }
                    });
                this.collectionCursor.createIndex( { customIdentifier: 1 }, { name: 'customIdentifier' } )
                    .then(() => {})
                    .catch(() => {});
                this.collectionCursor.createIndex( { type: 1, customIdentifier: 1 }, { name: 'typeWithCustomIdentifier' } )
                    .then(() => {})
                    .catch(() => {});
                this.collectionCursor.createIndex( {
                    type: 1, available: 1, inProgress: 1, scheduledAt: 1, customIdentifier: 1 }, { sparse: true } )
                    .then(() => {})
                    .catch(() => {});
                this.collectionCursor.createIndex( { priority: 1 }, { sparse: true } )
                    .then(() => {})
                    .catch(() => {});
                this.isReady = true;
            });
        }
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
    async deleteWithTypeAndCustomIdentifier(type: string, customIdentifier?: string): Promise<number> {
        const toDel: {[k: string]: string} = { type };
        if (customIdentifier) {
            toDel.customIdentifier = customIdentifier;
        }
        const collection = await this.getCollection();
        const delResult = await collection.deleteMany(toDel);
        return delResult.deletedCount;
    }
    async add(toAdd: JobJSON) {
        const toInsert = {
            ...toAdd,
        };
        delete toInsert.id;
        const collection = await this.getCollection();
        await collection.insertOne(toInsert);
    }
    async getJob(customIdentifier: string | number): Promise<null | JobJSON> {
        if (!customIdentifier) {
            return null;
        }
        const collection = await this.getCollection();
        const found = await collection.findOne({ customIdentifier });
        if (!found) {
            return null;
        }
        return convertDataToJob(found);
    }
    async checkForActionScheduled(type: string, customIdentifier: string | number): Promise<null | JobJSON> {
        const collection = await this.getCollection();
        const updated = await collection.findOne({
            type,
            available: true,
            inProgress: false,
            scheduledAt: { $gt: new Date().getTime() },
            customIdentifier,
        });
        if (!updated) {
            return null;
        }
        return convertDataToJob(updated);
    }
    async dequeueJob(jobType: string, quantity: number): Promise<Array<JobJSON>> {
        const collection = await this.getCollection();
        const toExecute = [];
        for (let i = 0; i < quantity; i += 1) {
            toExecute.push(collection.findOneAndUpdate({
                type: jobType,
                available: true,
                inProgress: false,
                scheduledAt: { $lt: new Date().getTime() },
            }, { $set: { inProgress: true } }, { sort: { priority: 1, _id: 1 }, returnOriginal: false }));
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
            results: toUpdateData.results,
        };
        await collection.findOneAndUpdate({ _id: new ObjectId(toUpdateData.id!) }, { $set: toUpdate }, { returnOriginal: false });
    }
}

export default DBRepo;
