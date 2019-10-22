import Job from './Job';
import Nullable from '../Interface/Nullable';
import {JobLog} from '../Interface/Job';

const type = 'My job';

test('Should be a function', () => {
    expect(typeof Job).toBe('function');
});

test('Should have createdAt attribute', () => {
    const job = new Job({ type });
    expect(typeof job.createdAt).toBe('number');
    expect(job.type).toBe(type);
    const job2 = new Job({ type, createdAt: 12392 });
    expect(job2.createdAt).toBe(12392);
});

test('Should have id attribute', () => {
    const job = new Job({ type });
    expect(typeof job.id).toBe('undefined');
    const job2 = new Job({ type, id: 'me' });
    expect(job2.id).toBe('me');
});

test('Should have data attribute', () => {
    const job = new Job({ type });
    expect(typeof job.data).toBe('undefined');
    const job2 = new Job({ type, data: { user: 'me' } });
    expect(job2.data).toMatchObject({ user: 'me' });
});

test('Should have status attribute', () => {
    const job = new Job({ type });
    expect(job.status).toBe('inqueue');
    const job2 = new Job({ type, status: 'success' });
    expect(job2.status).toBe('success');
});

test('Should have scheduledAt attribute', () => {
    const job = new Job({ type });
    expect(typeof job.scheduledAt).toBe('number');
    const job2 = new Job({ type, scheduledAt: 819821 });
    expect(job2.scheduledAt).toBe(819821);
});

test('Should have retry attribute', () => {
    const job = new Job({ type });
    expect(job.retry).toBe(0);
    const job2 = new Job({ type, retry: 5});
    expect(job2.retry).toBe(5);
});

test('Should have doneAt attribute', () => {
    const job = new Job({ type });
    expect(typeof job.doneAt).toBe('undefined');
    const job2 = new Job({ type, doneAt: 1728712});
    expect(job2.doneAt).toBe(1728712);
});

test('Should have available attribute', () => {
    const job = new Job({ type });
    expect(job.available).toBe(true);
    const job2 = new Job({ type, available: false });
    expect(job2.available).toBe(false);
});

test('Should have inProgress attribute', () => {
    const job = new Job({ type });
    expect(job.inProgress).toBe(false);
    const job2 = new Job({ type, inProgress: true });
    expect(job2.inProgress).toBe(true);
});

test('Should have logs attribute', () => {
    const job = new Job({ type });
    expect(job.logs.length).toBe(0);
    const job2 = new Job({
        type,
        logs: [
            { createdAt: new Date().getTime(), log: 'log1', },
            { createdAt: new Date().getTime(), log: 'log1', },
        ],
    });
    expect(job2.logs.length).toBe(2);
});

test('Should return json', () => {
    const jobData: {
        status: | 'success' | 'failed',
        id: string,
        type: string,
        logs: Array<JobLog>,
        data: any,
        createdAt: number,
        scheduledAt: number,
        inProgress: boolean,
        available: boolean,
        doneAt: number,
        retry: number,
    } = {
        id: 'me',
        type: 'me',
        logs: [],
        data: { ok: 1 },
        createdAt: new Date().getTime(),
        scheduledAt: new Date().getTime(),
        inProgress: false,
        available: true,
        doneAt: new Date().getTime(),
        retry: 2,
        status: 'success',
    };
    const job = new Job(jobData);
    expect(job.json()).toMatchObject(job);
});

test('addLog method should add a new log', () => {
    const job = new Job({ type });
    job.addLog('me');
    expect(job.logs.length).toBe(1);
    job.addLog('you');
    expect(job.logs.length).toBe(2);
});

test('complete should change status job', () => {
    const job = new Job({ type });
    job.complete({ status: true });
    expect(job.inProgress).toBe(false);
    expect(job.status).toBe('success');
    expect(job.available).toBe(false);
    expect(job.logs.length).toBe(1);
    expect(typeof job.doneAt).toBe('number');
    job.complete();
    expect(job.logs.length).toBe(2);
});

test('reqeueue should increment retry, and add a log', () => {
    const job = new Job({ type });
    job.reqeueue(60000 * 5);
    expect(job.status).toBe('failed');
    expect(job.inProgress).toBe(false);
    expect(job.retry).toBe(1);
    expect(job.available).toBe(true);
    expect(job.logs.length).toBe(1);
    expect(job.scheduledAt > new Date().getTime());
    job.reqeueue(60000 * 5, 'oups');
    expect(job.logs.length).toBe(2);
});

test('failed should make job not available', () => {
    const job = new Job({ type });
    job.failed();
    expect(job.available).toBe(false);
    expect(job.inProgress).toBe(false);
    expect(job.status).toBe('failed');
    expect(job.logs.length).toBe(1);
});
