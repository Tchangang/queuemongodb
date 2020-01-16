"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Job = /** @class */ (function () {
    function Job(params) {
        this.type = '';
        this.status = 'inqueue';
        this.inProgress = false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSm9iLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0VudGl0eS9Kb2IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQTtJQWNJLGFBQVksTUFjWDtRQTFCRCxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBRWxCLFdBQU0sR0FBdUMsU0FBUyxDQUFDO1FBQ3ZELGVBQVUsR0FBRyxLQUFLLENBQUM7UUFDbkIsY0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakMsZ0JBQVcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25DLFVBQUssR0FBVyxDQUFDLENBQUM7UUFFbEIsY0FBUyxHQUFHLElBQUksQ0FBQztRQUNqQixTQUFJLEdBQWtCLEVBQUUsQ0FBQztRQUV6QixxQkFBZ0IsR0FBOEIsSUFBSSxDQUFDO1FBZ0IvQyxJQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUU7WUFDWCxJQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUM7U0FDdkI7UUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzlCLElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtZQUNiLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztTQUMzQjtRQUNELElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUMvQjtRQUNELElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7U0FDdkM7UUFDRCxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1NBQ3JDO1FBQ0QsSUFBSSxNQUFNLENB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