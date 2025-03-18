#/bin/sh

# ngrokのトークンを設定
ngrok authtoken ${NGROK_TOKEN}

# LINE developersにngrokのhttps urlを登録
node ./develop/registWebhookURL.js
