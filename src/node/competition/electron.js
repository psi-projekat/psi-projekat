'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const php = require('../php');
const comp = require('.');

setTimeout(() => main().catch(O.exit));

async function main(){
  const compData = await php.exec('processNextCompetition');
  const pointsPrev = getPoints(compData);

  await comp.render(compData);

  const points = getPoints(compData);
  await php.exec('updatePoints', O.keys(points).map(nick => [nick, points[nick]]));

  log('\nResults:\n');
  for(const nick in points)
    log(`${nick}: ${points[nick] - pointsPrev[nick]}`);

  O.exit();
}

function getPoints(compData){
  const points = O.obj();

  for(const user of compData.users)
    points[user.nick] = user.points;

  return points;
}