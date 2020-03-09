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
            this.db = new DBRepo_1.default(this.mongoURI, this.dbName, this.collectionName);
        }
        else {
            this.db = params.dbRepo;
        }
        this.handleResetPeriodCount();
        this.emitter.emit(DBDequeur.JobTypes.dequeue);
    }
    DBDequeur.prototype.handleResetPeriodCount = function () {
        var _this = this;
        this.emitter.on(DBDequeur.JobTypes.resetPeriodCount, function (args) {
            if (typeof args === 'object' && args && Object(args).hasOwnProperty('event') && typeof args.event === 'string'
                && Object(args).hasOwnProperty('delay') && typeof args.delay === 'number') {
                var localTimeout_1 = setTimeout(function () {
                    if (_this.eventsList[args.event]) {
                        _this.eventsList[args.event].currentOnPeriod = 0;
                        _this.eventsList[args.event].limitReached = false;
                    }
                    clearTimeout(localTimeout_1);
                    _this.emitter.emit(DBDequeur.JobTypes.resetPeriodCount, args);
                }, args.delay);
            }
        });
    };
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
                            quantityDequeable = 0;
                            if (this.eventsList[keys[i]].maxOnPeriod > 0) {
                                if (!this.eventsList[keys[i]].limitReached) {
                                    quantityDequeable = Math.min(this.eventsList[keys[i]].max - this.eventsList[keys[i]].current, this.eventsList[keys[i]].maxOnPeriod - this.eventsList[keys[i]].currentOnPeriod);
                                }
                            }
                            else {
                                quantityDequeable = this.eventsList[keys[i]].max - this.eventsList[keys[i]].current;
                            }
                            console.log(keys[i], quantityDequeable);
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
            this.eventsList[type].currentOnPeriod += number;
            if (this.eventsList[type].currentOnPeriod >= this.eventsList[type].maxOnPeriod) {
                this.eventsList[type].limitReached = true;
            }
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
            var infos, maxOnPeriod, delayNumber, delayType, delay;
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.eventsList[eventType]) {
                    this.eventsList[eventType] = {
                        max: max,
                        current: 0,
                        maxOnPeriod: 0,
                        currentOnPeriod: 0,
                        limitReached: false,
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
                        infos = limit.toLowerCase().split('/');
                        maxOnPeriod = (infos.length === 2 && parseInt(infos[0], 10)) || null;
                        console.log('maxOnPeriod', maxOnPeriod);
                        delayNumber = (infos.length === 2 && infos[1].match(/\d+/g) && infos[1].match(/\d+/g)[0]
                            && parseInt(infos[1].match(/\d+/g)[0])) || 1;
                        delayType = (infos.length === 2 && infos[1].replace(/\d+/g, '').toLowerCase()) || null;
                        console.log(maxOnPeriod);
                        console.log(delayType);
                        console.log(delayNumber);
                        if (maxOnPeriod && delayNumber && delayType && ['second', 'minute', 'hour', 'day', 'week', 'month'].includes(delayType)) {
                            this.eventsList[eventType].maxOnPeriod = maxOnPeriod;
                            this.eventsList[eventType].currentOnPeriod = 0;
                            delay = delayNumber;
                            switch (delayType) {
                                case 'second':
                                    delay = delay * 1000;
                                    break;
                                case 'minute':
                                    delay = delay * 1000 * 60;
                                    break;
                                case 'hour':
                                    delay = delay * 1000 * 60 * 60;
                                    break;
                                case 'day':
                                    delay = delay * 1000 * 60 * 60 * 24;
                                    break;
                                case 'week':
                                    delay = delay * 1000 * 60 * 60 * 24 * 7;
                                    break;
                                case 'month':
                                    delay = delay * 1000 * 60 * 60 * 24 * 30;
                                    break;
                                default:
                                    delay = 0;
                                    break;
                            }
                            if (delay > 0) {
                                this.emitter.emit(DBDequeur.JobTypes.resetPeriodCount, { event: eventType, delay: delay });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQXNDO0FBSXRDLCtEQUF5QztBQUN6QyxxREFBK0I7QUFFL0I7SUFzQkksbUJBQVksTUFRQztRQVJiLGlCQWlDQztRQWxERCxrQkFBYSxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDM0IsYUFBUSxHQUFHLENBQUMsQ0FBQztRQUNiLGlCQUFZLEdBQUcsR0FBRyxDQUFDO1FBd0JmLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxxQkFBWSxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7WUFDekMsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDO1FBQzVDLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztTQUNuQztRQUNELElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7U0FDN0M7UUFDRCxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUU7WUFDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1NBQzNDO1FB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