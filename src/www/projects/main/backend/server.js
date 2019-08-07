'use strict';

const HOST = location.href.match(/\/([^\/\:]+)/)[1];
const PORT = 8082;
const ADDRESS = `http://${HOST}:${PORT}`;

/*
  This module performs client-server communication.
  Communication is realised using JSON.
*/

module.exports = {
  send,
};

function send(data){
  return new Promise((res, rej) => {
    const xhr = new window.XMLHttpRequest();

    xhr.onreadystatechange = () => {
      if(xhr.readyState !== 4) return;

      if(xhr.status !== 200)
        return rej(new Error(`Status code: ${xhr.status}`));

      res(JSON.parse(xhr.responseText));
    };

    xhr.open('POST', ADDRESS);
    xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
    xhr.send(JSON.stringify(data));
  });
}