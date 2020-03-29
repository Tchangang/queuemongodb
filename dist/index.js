"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var events_1 = require("events");
var DBRepo_1 = __importDefault(require("./Repository/DBRepo"));
var Job_1 = __importDefault(require("./Entity/Job"));
var countDoneSinceDate_1 = require("./Repository/countDoneSinceDate");
var getRateLimitFromStr_1 = require("./Repository/getRateLimitFromStr");
var DBDequeur = /** @class */ (function () {
    function DBDequeur(params) {
        var _this = this;
        this.jobRetryDelay = 60000 * 60;
        this.maxRetry = 5;
        this.refreshDelay = 500;
        this.emitter = new events_1.EventEmitter();
        this.emitter.on(DBDequeur.JobTypes.dequeue, function () {
            _this.getNextJobs();
            _this.removeOldJob();
        });
        this.collectionName = params.collectionName;
        this.mongoURI = params.mongoURI;
        this.dbName = params.dbName;
        this.eventsList = {};
        if (params.maxRetry) {
            this.maxRetry = params.maxRetry;
        }
        if (params.jobRetryDelay) {
            this.jobRetryDelay = params.jobRetryDelay;
        }
        if (params.refreshDelay) {
            this.refreshDelay = params.refreshDelay;
        }
        if (!params.dbRepo) {
            this.db = new DBRepo_1.default(this.mongoURI, this.dbName, this.collectionName);
        }
        else {
            this.db = params.dbRepo;
        }
        this.emitter.emit(DBDequeur.JobTypes.dequeue);
    }
    DBDequeur.prototype.removeOldJob = function () {
        var keys = Object.keys(this.eventsList);
        for (var i = 0; i < keys.length; i += 1) {
            if (this.eventsList[keys[i]] && this.eventsList[keys[i]].delay > 0) {
                var fromDate = new Date().getTime() - this.eventsList[keys[i]].delay;
                countDoneSinceDate_1.removeOldActionsDoneOlderThan(fromDate, this.eventsList[keys[i]].lists);
            }
        }
    };
    DBDequeur.prototype.getNextJobs = function () {
        var _this = this;
        this.timer = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var keys, toExecute, i, quantityDequeable, fromDate, actionsExecuted, promisesDone;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keys = Object.keys(this.eventsList);
                        toExecute = [];
                        for (i = 0; i < keys.length; i += 1) {
                            quantityDequeable = 0;
                            if (this.eventsList[keys[i]].maxOnPeriod > 0 && this.eventsList[keys[i]].delay > 0) {
                                fromDate = new Date().getTime() - this.eventsList[keys[i]].delay;
                                actionsExecuted = countDoneSinceDate_1.countActionsDoneSince(fromDate, this.eventsList[keys[i]].lists);
                                quantityDequeable = Math.min(this.eventsList[keys[i]].max - this.eventsList[keys[i]].current, this.eventsList[keys[i]].maxOnPeriod - actionsExecuted);
                            }
                            else {
                                quantityDequeable = this.eventsList[keys[i]].max - this.eventsList[keys[i]].current;
                            }
                            if (quantityDequeable > 0) {
                                toExecute.push(this.db.dequeueJob(keys[i], quantityDequeable));
                            }
                        }
                        return [4 /*yield*/, Promise.all(toExecute)];
                    case 1:
                        promisesDone = _a.sent();
                        promisesDone.map(function (items) {
                            items.map(function (item) {
                                _this.emitter.emit(item.type, item);
                            });
                        });
                        clearTimeout(this.timer);
                        this.timer = null;
                        this.emitter.emit(DBDequeur.JobTypes.dequeue);
                        return [2 /*return*/];
                }
            });
        }); }, this.refreshDelay);
    };
    DBDequeur.prototype.stop = function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    };
    DBDequeur.prototype.add = function (jobType, data, scheduledAt, customIdenfitier, priority) {
        return __awaiter(this, void 0, void 0, function () {
            var jobParams, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jobParams = {
                            type: jobType,
                            data: data,
                            priority: priority || 1,
                        };
                        if (typeof scheduledAt === 'number') {
                            jobParams.scheduledAt = scheduledAt;
                        }
                        if (typeof customIdenfitier === 'string' || typeof customIdenfitier === 'number') {
                            jobParams.customIdentifier = customIdenfitier;
                        }
                        job = new Job_1.default(jobParams);
                        return [4 /*yield*/, this.db.add(job)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DBDequeur.prototype.decreaseCurrentType = function (type, number) {
        if (number === void 0) { number = 1; }
        if (this.eventsList[type]) {
            this.eventsList[type].current -= number;
        }
    };
    DBDequeur.prototype.increaseCurrentType = function (type, number) {
        if (number === void 0) { number = 1; }
        if (this.eventsList[type]) {
            this.eventsList[type].current += number;
            this.eventsList[type].lists.push(new Date().getTime());
        }
    };
    DBDequeur.prototype.complete = function (jobData, successParams) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delete jobData.doneAt;
                        job = new Job_1.default({
                            id: jobData.id,
                            type: jobData.type,
                            data: jobData.data,
                            status: jobData.status,
                            inProgress: jobData.inProgress,
                            createdAt: jobData.createdAt,
                            scheduledAt: jobData.scheduledAt,
                            retry: jobData.retry,
                            logs: jobData.logs,
                            results: jobData.results,
                        });
                        job.complete(successParams);
                        this.decreaseCurrentType(job.type);
                        return [4 /*yield*/, this.db.update(job.json())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DBDequeur.prototype.requeue = function (jobData, failedParams) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        job = new Job_1.default({
                            id: jobData.id,
                            type: jobData.type,
                            data: jobData.data,
                            status: jobData.status,
                            inProgress: false,
                            createdAt: jobData.createdAt,
                            scheduledAt: jobData.scheduledAt,
                            retry: jobData.retry,
                            logs: jobData.logs,
                        });
                        this.decreaseCurrentType(job.type);
                        job.reqeueue(this.jobRetryDelay, failedParams);
                        if (!(job.retry >= this.maxRetry)) return [3 /*break*/, 2];
                        job.failed();
                        return [4 /*yield*/, this.db.update(job.json())];
                    case 1:
                        _a.sent();
                        this.emitter.emit(DBDequeur.JobTypes.maxRetry, job);
                        return [2 /*return*/];
                    case 2: return [4 /*yield*/, this.db.update(job.json())];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DBDequeur.prototype.getAction = function (customIdentifier) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.db.getJob(customIdentifier)];
            });
        });
    };
    DBDequeur.prototype.checkForActionScheduled = function (type, customIdentifier) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (typeof type !== 'string' || type.length === 0) {
                    return [2 /*return*/, null];
                }
                if (typeof customIdentifier !== 'string' || customIdentifier.length === 0) {
                    return [2 /*return*/, null];
                }
                return [2 /*return*/, this.db.checkForActionScheduled(type, customIdentifier)];
            });
        });
    };
    DBDequeur.prototype.on = function (eventType, max, callback, limit) {
        if (max === void 0) { max = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var rateLimit;
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.eventsList[eventType]) {
                    this.eventsList[eventType] = {
                        max: max,
                        current: 0,
                        maxOnPeriod: 0,
                        delay: 0,
                        lists: [],
                    };
                    this.emitter.on(eventType, function (jobToExecute) {
                        _this.increaseCurrentType(jobToExecute.type);
                        var complete = function (successParams, results) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.complete(__assign(__assign({}, jobToExecute), { results: results }), successParams)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        var requeue = function (failedParams) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.requeue(jobToExecute, failedParams)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        try {
                            callback(jobToExecute, complete.bind(_this), requeue.bind(_this));
                        }
                        catch (e) {
                            _this.requeue(jobToExecute)
                                .then(function () { });
                        }
                    });
                    if (limit && typeof limit === 'string' && limit.length >= 4) {
                        rateLimit = getRateLimitFromStr_1.getRateLimitFromStr(limit);
                        if (rateLimit) {
                            this.eventsList[eventType].maxOnPeriod = rateLimit.maxOnPeriod;
                            if (rateLimit.delay > 0) {
                                this.eventsList[eventType].delay = rateLimit.delay;
                                this.emitter.emit(DBDequeur.JobTypes.resetPeriodCount, { event: eventType, delay: rateLimit.delay });
                            }
                        }
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    DBDequeur.JobTypes = {
        maxRetry: 'MAX_RETRY',
        dequeue: 'DEQUEUE',
        resetPeriodCount: 'RESET_PERIOD_COUNT',
    };
    return DBDequeur;
}());
module.exports = DBDequeur;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQXNDO0FBSXRDLCtEQUF5QztBQUN6QyxxREFBK0I7QUFDL0Isc0VBQXFHO0FBQ3JHLHdFQUFxRTtBQUVyRTtJQXNCSSxtQkFBWSxNQVNDO1FBVGIsaUJBa0NDO1FBbkRELGtCQUFhLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUMzQixhQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsaUJBQVksR0FBRyxHQUFHLENBQUM7UUF5QmYsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLHFCQUFZLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUN6QyxLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsS0FBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDO1FBQzVDLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztTQUNuQztRQUNELElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7U0FDN0M7UUFDRCxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVB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