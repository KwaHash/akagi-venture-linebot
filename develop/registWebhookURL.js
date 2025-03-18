'use strict';

/**
 * コールバック(Webhook)URLの登録
 */

const ngrok = require('ngrok');
const axios = require('axios');
// const { execSync } = require('child_process');

/**
 * ngrokを使ってlocalhost:${PORT}をトンネリング
 * @returns https URL
 */
const getNgrokURL = async () => {
  let result = null
  try {
    result = await ngrok.connect({
      proto: 'http',
      addr: process.env.LINE_HOST_PORT,
      // configPath: '/root/.ngrok2/ngrok.yml',
      configPath: '/root/.config/ngrok/ngrok.yml',
    })
  } catch (e) {
    console.log('=== error ===')
    if (e.response && e.response.body) console.log(e.response.body)
    else if (e.response) console.log(e.response)
    else console.log(e)
    console.log('=============================')
  }
  return result
};


const registWebhookURL = async () => {
  try {
    const url = await getNgrokURL()
    if (!url) return
    const endpoint = `${url}/callback`
    axios({
      method: 'PUT',
      url: 'https://api.line.me/v2/bot/channel/webhook/endpoint',
      headers: {
        'Authorization': `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
        'Content-type': 'application/json',
      },
      data: {
        endpoint,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          console.log(endpoint)
          // 挙動は期待通りだがapplicationのlogが見れない
          // execSync('npm run start:dev', { cmd: '../' });
          // execSync('nest start --watch', { cmd: '../' });
        }
      })
      .catch((error) => {
        if (error.response) console.log(error.response.data)
        else console.log(error)
      });
  } catch (e) {
    console.log('---------- error ----------')
    if (e.response && e.response.body) console.log(e.response.body)
    else if (e.response) console.log(e.response)
    else console.log(e);
    console.log('---------------------------')
  }
};


registWebhookURL();
