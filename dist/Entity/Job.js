"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Job = /** @class */ (function () {
    function Job(params) {
        this.type = '';
        this.status = 'inqueue';
        this.inProgress = false;
        this.priority = 1;
        this.createdAt = new Date().getTime();
        this.scheduledAt = new Date().getTime();
        this.retry = 0;
        this.available = true;
        this.logs = [];
        this.customIdentifier = null;
        if (params.id) {
            this.id = params.id;
        }
        this.type = params.type || '';
        if (params.data) {
            this.data = params.data;
        }
        if (params.status) {
            this.status = params.status;
        }
        if (params.inProgress) {
            this.inProgress = params.inProgress;
        }
        if (params.createdAt) {
            this.createdAt = params.createdAt;
        }
        if (params.scheduledAt) {
            this.scheduledAt = params.scheduledAt;
        }
        if (params.retry) {
            this.retry = params.retry;
        }
        if (params.doneAt) {
            this.doneAt = params.doneAt;
        }
        if (params.logs) {
            this.logs = params.logs;
        }
        if (typeof params.available === 'boolean') {
            this.available = params.available;
        }
        if (typeof params.customIdentifier === 'string' || typeof params.customIdentifier === 'number') {
            this.customIdentifier = params.customIdentifier;
        }
        if (params.results) {
            this.results = params.results;
        }
        if (params.priority) {
            this.priority = params.priority;
        }
    }
    Job.prototype.json = function () {
        return {
            id: this.id,
            available: this.available,
            type: this.type,
            data: this.data,
            status: this.status,
            inProgress: this.inProgress,
            createdAt: this.createdAt,
            scheduledAt: this.scheduledAt,
            retry: this.retry,
            doneAt: this.doneAt,
            logs: this.logs,
            customIdentifier: this.customIdentifier,
            results: this.results,
            priority: this.priority,
        };
    };
    Job.prototype.addLog = function (log) {
        this.logs.push({ createdAt: new Date().getTime(), log: log });
    };
    Job.prototype.complete = function (successParams) {
        this.status = 'success';
        this.doneAt = new Date().getTime();
        this.available = false;
        this.inProgress = false;
        if (typeof successParams !== 'undefined') {
            this.addLog('Job done successfully at '.concat(new Date().toString()).concat(' with answer: ').concat(JSON.stringify(successParams || {})));
        }
        else {
            this.addLog('Job done successfully at '.concat(new Date().toString()));
        }
    };
    Job.prototype.reqeueue = function (delay, failedParams) {
        this.status = 'failed';
        this.retry += 1;
        this.inProgress = false;
        this.available = true;
        this.scheduledAt = new Date().getTime() + delay;
        if (typeof failedParams !== 'undefined') {
            this.addLog('Job failed for'.concat(this.retry.toString()).concat(' time at ').concat(new Date().toString()).concat(' with answer: ').concat(JSON.stringify(failedParams || {})));
        }
        else {
            this.addLog('Job failed for'.concat(this.retry.toString()).concat(' time at ').concat(new Date().toString()));
        }
    };
    Job.prototype.failed = function () {
        this.status = 'failed';
        this.inProgress = false;
        this.available = false;
        this.addLog('Job totally failed for'.concat(this.retry.toString()).concat(' time at ').concat(new Date().toString()));
    };
    return Job;
}());
exports.default = Job;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSm9iLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0VudGl0eS9Kb2IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQTtJQWVJLGFBQVksTUFlWDtRQTVCRCxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBRWxCLFdBQU0sR0FBdUMsU0FBUyxDQUFDO1FBQ3ZELGVBQVUsR0FBRyxLQUFLLENBQUM7UUFDbkIsYUFBUSxHQUFXLENBQUMsQ0FBQztRQUNyQixjQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQyxnQkFBVyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkMsVUFBSyxHQUFXLENBQUMsQ0FBQztRQUVsQixjQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLFNBQUksR0FBa0IsRUFBRSxDQUFDO1FBRXpCLHFCQUFnQixHQUE4QixJQUFJLENBQUM7UUFpQi9DLElBQUksTUFBTSxDQUFDLEVBQUUsRUFBRTtZQUNYLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQztTQUN2QjtRQUNELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFDOUIsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ2IsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1NBQzNCO1FBQ0QsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2YsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1NBQy9CO1FBQ0QsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFO1lBQ25CLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztTQUN2QztRQUNELElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRTtZQUNsQixJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENB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