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
    DBDequeur.prototype.add = function (jobType, data, scheduledAt, customIdenfitier) {
        return __awaiter(this, void 0, void 0, function () {
            var jobParams, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jobParams = {
                            type: jobType,
                            data: data,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQXNDO0FBSXRDLCtEQUF5QztBQUN6QyxxREFBK0I7QUFDL0Isc0VBQXFHO0FBQ3JHLHdFQUFxRTtBQUVyRTtJQXNCSSxtQkFBWSxNQVFDO1FBUmIsaUJBaUNDO1FBbERELGtCQUFhLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUMzQixhQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsaUJBQVksR0FBRyxHQUFHLENBQUM7UUF3QmYsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLHFCQUFZLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUN6QyxLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsS0FBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDO1FBQzVDLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztTQUNuQztRQUNELElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7U0FDN0M7UUFDRCxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVB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