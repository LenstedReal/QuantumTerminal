const { proxy } = require("./_proxy");
const URL = "https://api.coingecko.com/api/v3/global";
module.exports = (req, res) => proxy(res, URL, (d) => d && d.data && typeof d.data === "object");
