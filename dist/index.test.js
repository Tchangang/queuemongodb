"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = __importDefault(require("./index"));
test('Should be a function', function () {
    expect(typeof index_1.default).toBe('function');
});
// test('Should create DbDequeuer instance and handle job', async () => {
//     const maxInserted = 5;
//     const res = await new Promise((resolve) => {
//         const jobHandler = new DBDequeuer({
//             mongoURI: process.env.LOCAL_DB || '',
//             dbName: process.env.LOCAL_DB_LGM || '',
//             collectionName: 'jobshandler',
//         });
//         let cpt = 0;
//         jobHandler.on('worknow', 1, async (job, complete, requeue) => {
//             console.log('new job', job);
//             await complete();
//             console.log('done');
//             cpt ++;
//             if (cpt === maxInserted) {
//                 resolve(true);
//             }
//         });
//         for (let i = 0; i < maxInserted; i += 1) {
//             console.log('i', i);
//             jobHandler.add('worknow', { id: i, context: 'testing' })
//                 .then(() => {
//                     console.log('job added');
//                 });
//         }
//     });
//     expect(res).toBe(true);
// }, 7000);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsa0RBQWlDO0FBRWpDLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtJQUN6QixNQUFNLENBQUMsT0FBTyxlQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDLENBQUM7QUFFSCx5RUFBeUU7QUFDekUsNkJBQTZCO0FBQzdCLG1EQUFtRDtBQUNuRCw4Q0FBOEM7QUFDOUMsb0RBQW9EO0FBQ3BELHNEQUFzRDtBQUN0RCw2Q0FBNkM7QUFDN0MsY0FBYztBQUNkLHVCQUF1QjtBQUN2QiwwRUFBMEU7QUFDMUUsMkNBQTJDO0FBQzNDLGdDQUFnQztBQUNoQyxtQ0FBbUM7QUFDbkMsc0JBQXNCO0FBQ3RCLHlDQUF5QztBQUN6QyxpQ0FBaUM7QUFDakMsZ0JBQWdCO0FBQ2hCLGNBQWM7QUFDZCxxREFBcUQ7QUFDckQsbUNBQW1DO0FBQ25DLHVFQUF1RTtBQUN2RSxnQ0FBZ0M7QUFDaEMsZ0RBQWdEO0FBQ2hELHNCQUFzQjtBQUN0QixZQUFZO0FBQ1osVUFBVTtBQUNWLDhCQUE4QjtBQUM5QixZQUFZIn0=