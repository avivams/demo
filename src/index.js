const express = require('express');
const api_v1 = require('./api/v1');
const api_v2 = require('./api/v2');
const app = express();
const port = 3000;

const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const getInstanceId = async () => {
  return new Promise((resolve, _) => {
    new AWS.MetadataService().request('/latest/meta-data/instance-id', (_, id) => {
      resolve(id || "unknown-instance");
    });
    
  });
};

async function main() {
  const streamName =  "MainApp-" + (await getInstanceId());
  winston.add(new WinstonCloudWatch({
    awsRegion: 'us-east-1',
    jsonMessage: true,
    logGroupName: 'testing',
    logStreamName: streamName
  }));

  app.use(express.json());

  app.use((req, res, next) => {
    winston.info(`Incoming Request: ${req.method} ${req.url}`);
    next();
  });

  app.use((err, req, res, next) => {
    winston.error(`Error: ${err.message}`);
    res.status(500).send('Internal Server Error');
  });

  // versioning here only to show concept - no actual difference between them
  app.use('/api/v1', api_v1);
  app.use('/api/v2', api_v2);

  app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
  });
}

main();
