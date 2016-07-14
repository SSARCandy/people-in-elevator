const connect = require('connect');
const serveStatic = require('serve-static');

connect().use(serveStatic(__dirname)).listen(4000, ()=> { console.log('start at 4000'); });