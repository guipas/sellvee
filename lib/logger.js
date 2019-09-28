module.exports = config => ({
    log :  (...args) => config.log === true ? console.log(...args) : null,// eslint-disable-line
})