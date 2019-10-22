#Queue manager for mongoDB

##Create queuemangaer

```javascript
    const jobHandler = new DBDequeuer({ 
      mongoURI: process.env.LOCAL_DB || '', // MongoURI NEEDED
      dbName: process.env.LOCAL_DB_LGM || '', // Mongo DB name NEEDED
      collectionName: 'jobshandler', // collection to use - NEEDED - will be created if not found 
      jobRetryDelay: 60000 * 60, // Delay in ms to retry failed job. Default to 1h = 3 600 000 ms
      maxRetry: 5, // Time to retry a failed job. Default 5
      refreshDelay: 250, // Queue refresh delay in ms. Default to 250 ms. 
    });
```

##Create job
```javascript
    async jobHandler.add(jobType: string, jobData: any);
    Ex: await jobHandler.add('findemail', { firstname: 'boris', lastname: 'tchangang', domain: 'adomain.com' });
```

## Handle job
````javascript
    jobHandler.on(jobType: string, conccurrency: number, callback)
````
- **jobType** should be type of job you want to dequeue.
- **conccurrency** is the number of parallel job allowed
- **callback** is  a function that take 3 parameters: 
     - first parameter is jobData
     - second is a function named complete that should be call when the job is complete to remove job from queue.
     - third is a function name requeue that should be call when the job failed to re-insert job in queue with a delay.

*Exemple*
```javascript
   jobHandler.on('findemail', 10, async (jobData, complete, requeue) => {
     // jobData is { firstname: 'boris', lastname: 'tchangang', domain: 'adomain.com' }
     // process job data to whatever you want
     const email = await searchEmail(jobData.firstname, jobData.lastname, jobData.domain);
     if (email) {
       await saveEmail(email);
     }
     // call complete or requeue after
     complete();
   }); 
```

Feel free to ask new functionnalities if needed :-)
