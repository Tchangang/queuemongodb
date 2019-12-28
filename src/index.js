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
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var DBDequeur = /** @class */ (function () {
    function DBDequeur(mongoURI, collectionName, jobRetry, maxRetry) {
        this.jobRetry = 60000 * 60;
        this.maxRetry = 5;
        this.emitter = new events_1.EventEmitter();
        this.collectionName = collectionName;
        this.mongoURI = mongoURI;
        this.eventsList = {};
        this.maxRetry = maxRetry;
        this.getNextJobs()
            .then(function () { });
    }
    DBDequeur.prototype.getNextJobs = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DBDequeur.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                setTimeout(function () {
                }, 5000);
                return [2 /*return*/];
            });
        });
    };
    DBDequeur.prototype.add = function (jobType, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DBDequeur.prototype.decreaseCurrentType = function (type) {
        if (this.eventsList[type]) {
            this.eventsList[type].current--;
        }
    };
    DBDequeur.prototype.increaseCurrentType = function (type) {
        if (this.eventsList[type]) {
            this.eventsList[type].current++;
        }
    };
    DBDequeur.prototype.complete = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.decreaseCurrentType(job.type);
                return [2 /*return*/];
            });
        });
    };
    DBDequeur.prototype.requeue = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.decreaseCurrentType(job.type);
                job.retry += 1;
                job.inProgress = false;
                job.scheduledAt = new Date().getTime() + this.jobRetry;
                if (job.retry >= this.maxRetry) {
                    this.emitter.emit(DBDequeur.JobTypes.maxRetry, job);
                    return [2 /*return*/];
                }
                setTimeout(function () {
                }, 500);
                return [2 /*return*/];
            });
        });
    };
    DBDequeur.prototype.on = function (eventType, max, callback) {
        var _this = this;
        if (max === void 0) { max = 5; }
        if (!this.eventsList[eventType]) {
            this.eventsList[eventType] = {
                max: 0,
                current: 0,
            };
            this.emitter.on(eventType, function (jobToExecute) {
                var complete = function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.complete(jobToExecute.id)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); };
                var requeue = function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.requeue(jobToExecute.id)];
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
    };
    DBDequeur.JobTypes = {
        maxRetry: 'MAX_RETRY',
    };
    return DBDequeur;
}());
exports.default = DBDequeur;
