const getTimePassed = function (timeStamp) {
    const timePassedMillis = new Date().valueOf() - timeStamp.valueOf();
    const timePassed = {
        seconds: timePassedMillis / 1000,
        minutes: timePassedMillis / 60000,
        hours: timePassedMillis / (60000 * 60),
        days: timePassedMillis / (60000 * 60 * 24),
    };

    return timePassed.seconds < 60
        ? "Just Now"
        : timePassed.minutes < 60
        ? `${Math.floor(timePassed.minutes)}m ago`
        : timePassed.hours < 24
        ? `${Math.floor(timePassed.hours)}h ago`
        : `${Math.floor(timePassed.days)}d ago`;
};

module.exports = { getTimePassed };
