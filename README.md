# date2block

Simple utility for estimating Ethereum block numbers from dates.

Estimates are generated using previous block times, no external requests are sent. Estimates are typically accurate within a few hours.

## Usage

```
require { date2block } = require('date2block');

const date = new Date('2020-01-01T12:00:00.000Z')

console.log(date2Block(date))
// prints 9195735
```
