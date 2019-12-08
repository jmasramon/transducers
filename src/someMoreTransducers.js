// The log file has the following format:
// 127.0.0.1 - - [26/Feb/2015 19:25:25] "GET /static/r.js HTTP/1.1" 304 -
// 127.0.0.5 - - [26/Feb/2015 19:27:35] "GET /blog/ HTTP/1.1" 200 -
// 127.0.0.1 - - [28/Feb/2015 16:44:03] "GET / HTTP/1.1" 200 -
// 127.0.0.1 - - [28/Feb/2015 16:44:03] "POST / HTTP/1.1" 200 -
// We want to skip all requests to static resources and print only the IP address
// and the URL visited

/* jshint esversion: 6 */
const fs = require('fs');
const r = require('ramda');
const t = require('transducers-js');
var stream = require('transduce-stream');

const logFile = fs.readFileSync('data/access.log', {
    encoding: 'utf8',
});

const lines = r.split('\n', logFile);
const nonStatic = t.filter(r.complement(r.contains('static')));
const ipAndUrl = r.compose(
    t.map(r.match(/^(\S+).+"([^"]+)"/)),
    t.map(r.tail),
);
const cleanUrl = r.compose(
    t.map(r.over(r.lensIndex(1), r.split(' '))),
    t.map(r.over(r.lensIndex(1), r.slice(1, -1))),
    t.map(r.over(r.lensIndex(1), r.prepend('https://simplectic.com'))),
    t.map(r.over(r.lensIndex(1), r.join(''))),
);
const joinIpAndUrlAgain = t.map(r.join(' visited '));
const addNewlines = r.chain(s => [s, '\n']);

const parseLog = r.compose(
    nonStatic,
    ipAndUrl,
    cleanUrl,
    joinIpAndUrlAgain,
    addNewlines);

const result = t.transduce(
    parseLog,
    r.concat,
    '',
    lines);

// console.log(`file content: ${JSON.stringify(result, null, 2)}`);
console.log(`file content: ${result}`);


process.stdin.pipe(stream(parseLog)).pipe(process.stdout);
process.stdin.resume();

//echo '\n127.0.0.1 - - [24/Mar/2015 20:16:49] "GET /kkdevak HTTP/1.1" 200 -' >> data/access.log