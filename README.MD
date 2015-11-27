[![Cool-services Logo](https://cldup.com/6YxxZ_IXMJ-1200x1200.png)](http://senaev.com/cool-services/)

```js
const app = require('express')();

const Service = require('cool-services');
const service = new Service();

service.addSource(__dirname);

app.post('/service', service.call());

app.listen(80);
```

## Installation

```bash
$ npm install cool-services
```

## Philosophy

  The cool-services philosophy is to provide portable api for HTTP servers, making
  it a great solution for simple and complicated API, contained one or several services.

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## License

  [MIT](LICENSE)
