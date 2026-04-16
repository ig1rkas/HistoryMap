module.exports = {
    test: {
        testTimeout: 60000,
        hookTimeout: 60000,
        include: [ 'tests/**/*.test.js' ],
        globals: false,
        fileParallelism: false
    }
};
