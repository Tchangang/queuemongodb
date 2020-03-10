function getRateLimitFromStr(limit: string | null): null | { delay: number, maxOnPeriod: number, delayType: string } {
    if (!limit) {
        return null;
    }
    const infos = limit.toLowerCase().split('/');
    const maxOnPeriod = (infos.length === 2 && parseInt(infos[0], 10)) || null;
    const delayNumber = (infos.length === 2 && infos[1].match(/\d+/g) && infos[1].match(/\d+/g)[0]
        && parseInt(infos[1].match(/\d+/g)[0])) || 1;
    const delayType = (infos.length === 2 && infos[1].replace(/\d+/g, '').toLowerCase()) || null;
    const toReturn = {
        delay: 0,
        maxOnPeriod,
        delayType: '',
    };
    if (maxOnPeriod && delayNumber && delayType && ['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 'day',
        'days', 'week', 'weeks', 'month', 'months'].includes(delayType)) {
        toReturn.delay = delayNumber;
        switch (delayType) {
            case 'second':
                toReturn.delay = toReturn.delay * 1000;
                toReturn.delayType = 'second';
                break;
            case 'seconds':
                toReturn.delay = toReturn.delay * 1000;
                toReturn.delayType = 'second';
                break;
            case 'minute':
                toReturn.delay = toReturn.delay * 1000 * 60;
                toReturn.delayType = 'minute';
                break;
            case 'minutes':
                toReturn.delay = toReturn.delay * 1000 * 60;
                toReturn.delayType = 'minute';
                break;
            case 'hour':
                toReturn.delay = toReturn.delay * 1000 * 60 * 60;
                toReturn.delayType = 'hour';
                break;
            case 'hours':
                toReturn.delay = toReturn.delay * 1000 * 60 * 60;
                toReturn.delayType = 'hours';
                break;
            case 'day':
                toReturn.delay = toReturn.delay * 1000 * 60 * 60 * 24;
                toReturn.delayType = 'day';
                break;
            case 'days':
                toReturn.delay = toReturn.delay * 1000 * 60 * 60 * 24;
                toReturn.delayType = 'day';
                break;
            case 'week':
                toReturn.delay = toReturn.delay * 1000 * 60 * 60 * 24 * 7;
                toReturn.delayType = 'week';
                break;
            case 'weeks':
                toReturn.delay = toReturn.delay * 1000 * 60 * 60 * 24 * 7;
                toReturn.delayType = 'weeks';
                break;
            case 'month':
                toReturn.delay = toReturn.delay * 1000 * 60 * 60 * 24 * 30;
                toReturn.delayType = 'month';
                break;
            case 'months':
                toReturn.delay = toReturn.delay * 1000 * 60 * 60 * 24 * 30;
                toReturn.delayType = 'months';
                break;
            default:
                toReturn.delay = 0;
                break;
        }
        return toReturn;
    }
    return null;
}

export {
    getRateLimitFromStr,
}
