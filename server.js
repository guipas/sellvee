

const sellvee = require('./app');
const express = require('express')

console.log('node env', process.env.NODE_ENV);

sellvee(require('./config'))
    .then(app => {
        // console.log('server', server)
        const server = express();
        server.get('/', (req, res) => res.send('Hello World!'))
        server.use(app);

        server.listen(3001, () => {
            console.log('listening on port 3001');
        })
    })


