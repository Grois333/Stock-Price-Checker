const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  suite('GET /api/stock-prices', function() {
    test('Viewing one stock', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=GOOG')
        .end(function(err, res) {
          assert.isNull(err);
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData);
          assert.isString(res.body.stockData.stock);
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          done();
        });
    });

    test('Viewing one stock and liking it', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=GOOG&like=true')
        .end(function(err, res) {
          assert.isNull(err);
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.equal(res.body.stockData.likes, 1);
          done();
        });
    });

    test('Viewing the same stock and liking it again', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=GOOG&like=true')
        .end(function(err, res) {
          assert.isNull(err);
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.equal(res.body.stockData.likes, 1);
          done();
        });
    });

    test('Viewing two stocks', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=GOOG&stock=MSFT')
        .end(function(err, res) {
          assert.isNull(err);
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);
          assert.equal(res.body.stockData[0].stock, 'GOOG');
          assert.isNumber(res.body.stockData[0].rel_likes);
          assert.equal(res.body.stockData[1].stock, 'MSFT');
          done();
        });
    });

    test('Viewing two stocks and liking them', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=GOOG&stock=MSFT&like=true')
        .end(function(err, res) {
          assert.isNull(err);
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);
          assert.equal(res.body.stockData[0].rel_likes, 0);
          assert.equal(res.body.stockData[1].rel_likes, 0);
          done();
        });
    });
  });
});
