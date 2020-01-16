import {JobJSON} from '../Interface/Job';
import Job from '../Entity/Job';

export default (data: any): JobJSON => {
    if (typeof data === 'object') {
        const job = new Job({});
        if (data._id) {
            job.id = data._id.toString();
        }
        if (data.available) {
            job.available = data.available;
        }
        if (data.type) {
            job.type = data.type;
        }
        if (data.data) {
            job.data = data.data;
        }
        if (data.inProgress) {
            job.inProgress = data.inProgress;
        }
        if (data.status) {
            job.status = data.status;
        }
        if (data.createdAt) {
            job.createdAt = data.createdAt;
        }
        if (data.scheduledAt) {
            job.scheduledAt = data.scheduledAt;
        }
        if (data.retry) {
            job.retry = data.retry;
        }
        if (data.doneAt) {
            job.doneAt = data.doneAt;
        }
        if (data.logs) {
            job.logs = data.logs;
        }
        if (data.results) {
            job.results = data.results;
        }
        return job.json();
    }
    throw new Error('Unable to convert data from db to job');
}
