const processSend = (name: string, payload?: any) => {
    if (process.send) {
        process.send({
            name,
            payload
        });
    }
};

export {processSend};
