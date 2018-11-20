const processSend = (name: string, payload?: any) => {
    process.send({name, payload});
};

export {processSend};
