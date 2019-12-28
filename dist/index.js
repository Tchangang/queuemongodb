"use strict";
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
var DBDequeur = /** @class */ (function () {
    function DBDequeur(params) {
        var _this = this;
        this.jobRetryDelay = 60000 * 60;
        this.maxRetry = 5;
        this.refreshDelay = 500;
        this.emitter = new events_1.EventEmitter();
        this.emitter.on(DBDequeur.JobTypes.dequeue, function () {
            _this.getNextJobs();
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
            console.log('there');
            this.db = new DBRepo_1.default(this.mongoURI, this.dbName, this.collectionName);
        }
        else {
            this.db = params.dbRepo;
        }
        this.getNextJobs();
    }
    DBDequeur.prototype.getNextJobs = function () {
        var _this = this;
        this.timer = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var keys, toExecute, i, quantityDequeable, promisesDone;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keys = Object.keys(this.eventsList);
                        toExecute = [];
                        for (i = 0; i < keys.length; i += 1) {
                            quantityDequeable = this.eventsList[keys[i]].max - this.eventsList[keys[i]].current;
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
                        this.emitter.emit(DBDequeur.JobTypes.dequeue);
                        this.timer = null;
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
                            inProgress: jobData.inProgress,
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
    DBDequeur.prototype.on = function (eventType, max, callback) {
        if (max === void 0) { max = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.eventsList[eventType]) {
                    this.eventsList[eventType] = {
                        max: max,
                        current: 0,
                    };
                    this.emitter.on(eventType, function (jobToExecute) {
                        _this.increaseCurrentType(jobToExecute.type);
                        var complete = function (successParams) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.complete(jobToExecute, successParams)];
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
                }
                return [2 /*return*/];
            });
        });
    };
    DBDequeur.JobTypes = {
        maxRetry: 'MAX_RETRY',
        dequeue: 'DEQUEUE',
    };
    return DBDequeur;
}());
module.exports = DBDequeur;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlDQUFzQztBQUl0QywrREFBeUM7QUFDekMscURBQStCO0FBRS9CO0lBa0JJLG1CQUFZLE1BUUM7UUFSYixpQkFpQ0M7UUE5Q0Qsa0JBQWEsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQzNCLGFBQVEsR0FBRyxDQUFDLENBQUM7UUFDYixpQkFBWSxHQUFHLEdBQUcsQ0FBQztRQW9CZixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUkscUJBQVksRUFBRSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO1lBQ3pDLEtBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQztRQUM1QyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUNqQixJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7U0FDbkM7UUFDRCxJQUFJLE1BQU0sQ0FBQyxhQUFhLEVBQUU7WUFDdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1NBQzdDO1FBQ0QsSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztTQUMzQztRQUNELElBQUksQ0FB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