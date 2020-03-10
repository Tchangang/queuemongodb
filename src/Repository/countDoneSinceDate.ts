function countActionsDoneSince(fromDate: number, val: Array<number>): number {
    let count = 0;
    for (let i = 0; i < val.length; i += 1) {
        if (val[val.length - i - 1] < fromDate) {
            break;
        }
        count += 1;
    }
    return count;
}

function removeOldActionsDoneOlderThan(fromDate: number, val: Array<number>) {
    let count = 0;
    for (let i = 0; i < val.length; i += 1) {
        if (val[i] > fromDate) {
            break;
        }
        count += 1;
    }
    if (count > 0) {
        val.splice(0, count)
    }
}

export {
    countActionsDoneSince,
    removeOldActionsDoneOlderThan,
}
