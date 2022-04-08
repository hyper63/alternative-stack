process.env.PORT = process.env.PORT ?? 3000;
process.env.ARC_LOCAL = process.env.ARC_LOCAL ?? 1;

const arc = require("@architect/architect");

void arc();
