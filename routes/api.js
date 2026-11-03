'use strict';

const https = require('https');
const crypto = require('crypto');

const stockLikes = new Map();

function getQuote(stock) {
  const url = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' +
    encodeURIComponent(stock.toUpperCase()) + '/quote';

  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 10000 }, response => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error('Stock proxy returned HTTP ' + response.statusCode));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on('timeout', () => request.destroy(new Error('Stock proxy timed out')));
    request.on('error', reject);
  });
}

function anonymousIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

function addLike(stock, hash) {
  const symbol = stock.toUpperCase();
  if (!stockLikes.has(symbol)) {
    stockLikes.set(symbol, { likes: 0, ips: new Set() });
  }
  const record = stockLikes.get(symbol);
  if (!record.ips.has(hash)) {
    record.ips.add(hash);
    record.likes++;
  }
  return record.likes;
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res) {
      const stocks = Array.isArray(req.query.stock)
        ? req.query.stock
        : (req.query.stock ? [req.query.stock] : []);

      if (!stocks.length || stocks.length > 2) {
        res.status(400).json({ error: 'invalid stock' });
        return;
      }

      const symbols = stocks.map(stock => String(stock).trim().toUpperCase()).filter(Boolean);
      if (!symbols.length || symbols.some(stock => !/^[A-Z][A-Z0-9.-]*$/.test(stock))) {
        res.status(400).json({ error: 'invalid stock' });
        return;
      }

      const hash = anonymousIp(req);
      Promise.all(symbols.map(stock => getQuote(stock)))
        .then(quotes => {
          const data = symbols.map((stock, index) => {
            const likes = req.query.like === 'true'
              ? addLike(stock, hash)
              : (stockLikes.has(stock) ? stockLikes.get(stock).likes : 0);
            return {
              stock,
              price: Number(quotes[index].latestPrice),
              likes
            };
          });

          if (data.length === 1) {
            res.json({ stockData: { stock: data[0].stock, price: data[0].price, likes: data[0].likes } });
          } else {
            res.json({
              stockData: [
                { stock: data[0].stock, price: data[0].price, rel_likes: data[0].likes - data[1].likes },
                { stock: data[1].stock, price: data[1].price, rel_likes: data[1].likes - data[0].likes }
              ]
            });
          }
        })
        .catch(error => {
          res.status(500).json({ error: error.message });
        });
    });
    
};
