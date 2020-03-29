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
    function DBRepo(mongoUri, dbName, collectionName, expiredAt) {
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
                _this.collectionCursor.indexes()
                    .then(function (indexes) {
                    var createdAtIndex = indexes.filter(function (index) { return index && index.name === 'createdAtExpired'; })[0];
                    console.log('createdATINDEX', createdAtIndex);
                    if (!createdAtIndex) {
                        return _this.collectionCursor.createIndex({ createdAt: -1 }, { expireAfterSeconds: expiredAt || 3600 * 48, name: 'createdAtExpired' });
                    }
                    if (expiredAt && createdAtIndex.expireAfterSeconds !== expiredAt) {
                        return _this.client.command({ collMod: collectionName,
                            index: { keyPattern: { createdAt: -1 },
                                expireAfterSeconds: expiredAt,
                            },
                        });
                    }
                });
                _this.collectionCursor.createIndex({ customIdentifier: 1 }, { name: 'customIdentifier' })
                    .then(function () { })
                    .catch(function () { });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiREJSZXBvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL1JlcG9zaXRvcnkvREJSZXBvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtQ0FBOEQ7QUFHOUQsaUNBQW1DO0FBQ25DLG9EQUF3QztBQUd4QyxJQUFJLE9BQU8sR0FBK0IsRUFBRSxDQUFDO0FBRTdDO0lBSUksZ0JBQVksUUFBZ0IsRUFDaEIsTUFBYyxFQUNkLGNBQXNCLEVBQ3RCLFNBQWtCO1FBSDlCLGlCQXVEQztRQTFETyxZQUFPLEdBQVksS0FBSyxDQUFDO1FBTzdCLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7U0FDdkM7UUFDRCxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1NBQ3JDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7U0FDN0M7UUFDRCxJQUFNLFVBQVUsR0FBTSxRQUFRLFNBQUksTUFBTSxTQUFJLGNBQWdCLENBQUM7UUFDN0QsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUN2QjthQUFNO1lBQ0gscUJBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO2dCQUMxQixlQUFlLEVBQUUsSUFBSTtnQkFD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