import DBDequeuer from './index';

test('Should be a function', () => {
    expect(typeof DBDequeuer).toBe('function');
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

