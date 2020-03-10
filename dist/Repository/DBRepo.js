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
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
var timers_1 = require("timers");
var JobDto_1 = __importDefault(require("./JobDto"));
var clients = {};
var DBRepo = /** @class */ (function () {
    function DBRepo(mongoUri, dbName, collectionName) {
        var _this = this;
        this.isReady = false;
        if (!mongoUri) {
            throw new Error('Missing mongoUri');
        }
        if (!dbName) {
            throw new Error('Missing dbName');
        }
        if (!collectionName) {
            throw new Error('Missing collectionName');
        }
        var identifier = mongoUri + "-" + dbName + "-" + collectionName;
        if (clients[identifier]) {
            this.client = clients[identifier].db(dbName);
            this.collectionCursor = this.client.collection(collectionName);
            this.isReady = true;
        }
        else {
            mongodb_1.MongoClient.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }, function (err, client) {
                clients[identifier] = client;
                _this.client = client.db(dbName);
                _this.collectionCursor = _this.client.collection(collectionName);
                _this.collectionCursor.createIndex({
                    type: 1, available: 1, inProgress: 1, scheduledAt: 1, customIdentifier: 1
                }, { sparse: true })
                    .then(function () { })
                    .catch(function () { });
                _this.collectionCursor.createIndex({ priority: 1 }, { sparse: true })
                    .then(function () { })
                    .catch(function () { });
                _this.isReady = true;
            });
        }
    }
    DBRepo.prototype.waitUntilReady = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        if (_this.isReady) {
                            return resolve();
                        }
                        var cpt = 0;
                        var timeoutCpt = Math.ceil(30000 / 200);
                        var interval = timers_1.setInterval(function () {
                            if (_this.isReady) {
                                clearInterval(interval);
                                return resolve();
                            }
                            cpt += 1;
                            if (cpt > timeoutCpt) {
                                clearInterval(interval);
                                throw new Error('Unable to connect');
                            }
                        }, 200);
                    })];
            });
        });
    };
    DBRepo.prototype.getCollection = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.waitUntilReady()];
                    case 1:
                        _a.sent();
                        if (!this.collectionCursor) {
                            throw new Error('Database not ready. Call waitUntilReady method and retry.');
                        }
                        return [2 /*return*/, this.collectionCursor];
                }
            });
        });
    };
    DBRepo.prototype.add = function (toAdd) {
        return __awaiter(this, void 0, void 0, function () {
            var toInsert, collection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        toInsert = __assign({}, toAdd);
                        delete toInsert.id;
                        return [4 /*yield*/, this.getCollection()];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, collection.insertOne(toInsert)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DBRepo.prototype.getJob = function (customIdentifier) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, found;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!customIdentifier) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.getCollection()];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, collection.findOne({ customIdentifier: customIdentifier })];
                    case 2:
                        found = _a.sent();
                        if (!found) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, JobDto_1.default(found)];
                }
            });
        });
    };
    DBRepo.prototype.checkForActionScheduled = function (type, customIdentifier) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection()];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, collection.findOne({
                                type: type,
                                available: true,
                                inProgress: false,
                                scheduledAt: { $gt: new Date().getTime() },
                                customIdentifier: customIdentifier,
                            })];
                    case 2:
                        updated = _a.sent();
                        if (!updated) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, JobDto_1.default(updated)];
                }
            });
        });
    };
    DBRepo.prototype.dequeueJob = function (jobType, quantity) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, toExecute, i, found, jobs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection()];
                    case 1:
                        collection = _a.sent();
                        toExecute = [];
                        for (i = 0; i < quantity; i += 1) {
                            toExecute.push(collection.findOneAndUpdate({
                                type: jobType,
                                available: true,
                                inProgress: false,
                                scheduledAt: { $lt: new Date().getTime() },
                            }, { $set: { inProgress: true } }, { sort: { priority: 1, _id: 1 }, returnOriginal: false }));
                        }
                        return [4 /*yield*/, Promise.all(toExecute)];
                    case 2:
                        found = _a.sent();
                        jobs = [];
                        found.map(function (result) {
                            if (result && result.ok && result.value) {
                                jobs.push(JobDto_1.default(result.value));
                            }
                            return null;
                        });
                        return [2 /*return*/, jobs];
                }
            });
        });
    };
    DBRepo.prototype.update = function (toUpdateData) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, toUpdate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection()];
                    case 1:
                        collection = _a.sent();
                        toUpdate = {
                            status: toUpdateData.status,
                            logs: toUpdateData.logs,
                            doneAt: toUpdateData.doneAt,
                            inProgress: toUpdateData.inProgress,
                            scheduledAt: toUpdateData.scheduledAt,
                            retry: toUpdateData.retry,
                            available: toUpdateData.available,
                            results: toUpdateData.results,
                        };
                        return [4 /*yield*/, collection.findOneAndUpdate({ _id: new mongodb_1.ObjectId(toUpdateData.id) }, { $set: toUpdate }, { returnOriginal: false })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DBRepo;
}());
exports.default = DBRepo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiREJSZXBvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL1JlcG9zaXRvcnkvREJSZXBvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtQ0FBOEQ7QUFHOUQsaUNBQW1DO0FBQ25DLG9EQUF3QztBQUd4QyxJQUFJLE9BQU8sR0FBK0IsRUFBRSxDQUFDO0FBRTdDO0lBSUksZ0JBQVksUUFBZ0IsRUFDaEIsTUFBYyxFQUNkLGNBQXNCO1FBRmxDLGlCQW1DQztRQXRDTyxZQUFPLEdBQVksS0FBSyxDQUFDO1FBTTdCLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7U0FDdkM7UUFDRCxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1NBQ3JDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7U0FDN0M7UUFDRCxJQUFNLFVBQVUsR0FBTSxRQUFRLFNBQUksTUFBTSxTQUFJLGNBQWdCLENBQUM7UUFDN0QsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUN2QjthQUFNO1lBQ0gscUJBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO2dCQUMxQixlQUFlLEVBQUUsSUFBSTtnQkFDckIsa0JBQWtCLEVB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