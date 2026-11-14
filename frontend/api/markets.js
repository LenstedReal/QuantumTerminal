const { proxy } = require("./_proxy");
const URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d";
module.exports = (req, res) => proxy(res, URL, (d) => Array.isArray(d) && d.length > 0);
