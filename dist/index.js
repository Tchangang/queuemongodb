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
            console.log('there');
            this.db = new DBRepo_1.default(this.mongoURI, this.dbName, this.collectionName);
        }
        else {
            this.db = params.dbRepo;
        }
        this.getNextJobs();
    }
    DBDequeur.prototype.getNextJobs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
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
                return [2 /*return*/];
            });
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQXNDO0FBSXRDLCtEQUF5QztBQUN6QyxxREFBK0I7QUFFL0I7SUFrQkksbUJBQVksTUFRQztRQVJiLGlCQWlDQztRQTlDRCxrQkFBYSxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDM0IsYUFBUSxHQUFHLENBQUMsQ0FBQztRQUNiLGlCQUFZLEdBQUcsR0FBRyxDQUFDO1FBb0JmLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxxQkFBWSxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7WUFDekMsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDO1FBQzVDLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztTQUNuQztRQUNELElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7U0FDN0M7UUFDRCxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUU7WUFDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1NBQzNDO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7WUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksZ0JBQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3pFO2FBQU07WUFDSCxJQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDM0I7UUFDRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUNhLCtCQUFXLEdBQXpCOzs7O2dCQUNJLElBQUksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDOzs7Ozs7Z0NBQ2QsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dDQUNwQyxTQUFTLEdBQWtDLEVBQUUsQ0FBQztnQ0FDcEQsS0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7b0NBQy9CLGlCQUFpQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO29DQUMxRixJQUFJLGlCQUFpQixHQUFHLENBQUMsRUFBRTt3Q0FDdkIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO3FDQUNsRTtpQ0FDSjtnQ0FDb0IscUJBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBQTs7Z0NBQTNDLFlBQVksR0FBRyxTQUE0QjtnQ0FDakQsWUFBWSxDQUFDLEdBQUcsQ0FBQyxVQUFDLEtBQXFCO29DQUNwQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsSUFBYTt3Q0FDcEIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztvQ0FDdkMsQ0FBQyxDQUFDLENBQUM7Z0NBQ04sQ0FBQyxDQUFDLENBQUM7Z0NBQ0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQ0FDOUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7Ozs7cUJBQ3JCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDOzs7O0tBQ3pCO0lBQ0Qsd0JBQUksR0FBSjtRQUNJLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7U0FDckI7SUFDTCxDQUFDO0lBQ0ssdUJBQUcsR0FBVCxVQUFVLE9BQWUsRUFBRSxJQUFTLEVBQUUsV0FBb0IsRUFBRSxnQkFBa0M7Ozs7Ozt3QkFDcEYsU0FBUyxHQUtYOzRCQUNBLElBQUksRUFBRSxPQUFPOzRCQUNiLElBQUksTUFBQTt5QkFDUCxDQUFDO3dCQUNGLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxFQUFFOzRCQUNqQyxTQUFTLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQzt5QkFDdkM7d0JBQ0QsSUFBSSxPQUFPLGdCQUFnQixLQUFLLFFBQVEsSUFBSSxPQUFPLGdCQUFnQixLQUFLLFFBQVEsRUFBRTs0QkFDOUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO3lCQUNqRDt3QkFDSyxHQUFHLEdBQUcsSUFBSSxhQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQy9CLHFCQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFBOzt3QkFBdEIsU0FBc0IsQ0FBQzs7Ozs7S0FDMUI7SUFDTyx1Q0FBbUIsR0FBM0IsVUFBNEIsSUFBWSxFQUFFLE1BQVU7UUFBVix1QkFBQSxFQUFBLFVBQVU7UUFDaEQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQztTQUMzQztJQUNMLENBQUM7SUFDTyx1Q0FBbUIsR0FBM0IsVUFBNEIsSUFBWSxFQUFFLE1BQVU7UUFBVix1QkFBQSxFQUFBLFVBQVU7UUFDaEQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQztTQUMzQztJQUNMLENBQUM7SUFDYSw0QkFBUSxHQUF0QixVQUF1QixPQUFnQixFQUFFLGFBQWtCOzs7Ozs7d0JBQ3ZELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQzt3QkFDaEIsR0FBRyxHQUFHLElBQUksYUFBRyxDQUFDOzRCQUNoQixFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUc7NEJBQ2YsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJOzRCQUNsQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7NEJBQ2xCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTs0QkFDdEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVOzRCQUM5QixTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7NEJBQzVCLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVzs0QkFDaEMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLOzRCQUNwQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7NEJBQ2xCLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTzt5QkFDM0IsQ0FBQyxDQUFDO3dCQUNILEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQzVCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ25DLHFCQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFBOzt3QkFBaEMsU0FBZ0MsQ0FBQzs7Ozs7S0FDcEM7SUFDYSwyQkFBTyxHQUFyQixVQUFzQixPQUFnQixFQUFFLFlBQWtCOzs7Ozs7d0JBQ2hELEdBQUcsR0FBRyxJQUFJLGFBQUcsQ0FBQzs0QkFDaEIsRUFBRSxFQUFFLE9BQU8sQ0FBQyxFQUFHOzRCQUNmLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTs0QkFDbEIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJOzRCQUNsQixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07NEJBQ3RCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTs0QkFDOUIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTOzRCQUM1QixXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7NEJBQ2hDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSzs0QkFDcEIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO3lCQUNyQixDQUFDLENBQUM7d0JBQ0gsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDbkMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDOzZCQUMzQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQSxFQUExQix3QkFBMEI7d0JBQzFCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDYixxQkFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBQTs7d0JBQWhDLFNBQWdDLENBQUM7d0JBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUNwRCxzQkFBTzs0QkFFWCxxQkFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBQTs7d0JBQWhDLFNBQWdDLENBQUM7Ozs7O0tBQ3BDO0lBQ0ssNkJBQVMsR0FBZixVQUFnQixnQkFBaUM7OztnQkFDN0Msc0JBQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBQzs7O0tBQzNDO0lBQ0ssMkNBQXVCLEdBQTdCLFVBQThCLElBQVksRUFBRSxnQkFBd0I7OztnQkFDaEUsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQy9DLHNCQUFPLElBQUksRUFBQztpQkFDZjtnQkFDRCxJQUFJLE9BQU8sZ0JBQWdCLEtBQUssUUFBUSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQ3ZFLHNCQUFPLElBQUksRUFBQztpQkFDZjtnQkFDRCxzQkFBTyxJQUFJLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxFQUFDOzs7S0FDbEU7SUFDSyxzQkFBRSxHQUFSLFVBQVMsU0FBaUIsRUFDakIsR0FBZSxFQUNmLFFBQ3NEO1FBRnRELG9CQUFBLEVBQUEsT0FBZTs7OztnQkFHcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUc7d0JBQ3pCLEdBQUcsS0FBQTt3QkFDSCxPQUFPLEVBQUUsQ0FBQztxQkFDYixDQUFDO29CQUNGLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFDLFlBQXFCO3dCQUM3QyxLQUFJLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUM1QyxJQUFNLFFBQVEsR0FBRyxVQUFPLGFBQW1CLEVBQUUsT0FBYTs7OzRDQUN0RCxxQkFBTSxJQUFJLENBQUMsUUFBUSx1QkFBTSxZQUFZLEtBQUUsT0FBTyxTQUFBLEtBQUksYUFBYSxDQUFDLEVBQUE7O3dDQUFoRSxTQUFnRSxDQUFDOzs7OzZCQUNwRSxDQUFDO3dCQUNGLElBQU0sT0FBTyxHQUFHLFVBQU8sWUFBa0I7Ozs0Q0FDckMscUJBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLEVBQUE7O3dDQUE5QyxTQUE4QyxDQUFDOzs7OzZCQUNsRCxDQUFDO3dCQUNGLElBQUk7NEJBQ0EsUUFBUSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQzt5QkFDbkU7d0JBQUMsT0FBTyxDQUFDLEVBQUU7NEJBQ1IsS0FBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUM7aUNBQ3JCLElBQUksQ0FBQyxjQUFPLENBQUMsQ0FBQyxDQUFDO3lCQUN2QjtvQkFDTCxDQUFDLENBQUMsQ0FBQztpQkFDTjs7OztLQUNKO0lBMUtNLGtCQUFRLEdBQUc7UUFDZCxRQUFRLEVBQUUsV0FBVztRQUNyQixPQUFPLEVBQUUsU0FBUztLQUNyQixDQUFDO0lBd0tOLGdCQUFDO0NBQUEsQUF6TEQsSUF5TEM7QUFDRCxpQkFBUyxTQUFTLENBQUMifQ==