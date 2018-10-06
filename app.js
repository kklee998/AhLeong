'use strict';

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  PAGE_ACCESS_TOKEN = 'EAAGuJTXP2QQBAMoWhL0zpguFTrajlWKUZCnmtZC676dzHAytGQZAeYKFdx8M05aM41lWAVtoSWWsDgLhwadgs7FhABnMILnBskWqXCI7qgA7JgliYDwU6j5XeFQG8Bw7O1QwfJR9FiFpudZAmy305VUO6ZCOXAyQgkYAeYzI2fgZDZD';

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// Serve the options path and set required headers
app.get('/login', (req, res, next) => {
    let referer = req.get('Referer');
    if (referer) {
        if (referer.indexOf('www.messenger.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
        } else if (referer.indexOf('www.facebook.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
        }
        res.sendFile('login.html', {root: __dirname});
    }
});

// Handle postback from webview
app.post('/loginpostback', (req, res) => {
    let body = req.body;
    console.log(body);
    console.log(body.username);
    console.log(body.password);
    console.log(body.psid);
    let response;
    if( body.username === 'admin' && body.password === 'admin123' ){
      response = {
        "text": 'Login Success!'
      };
    }else{
      response = {
        "text": 'Login Failed!'
      };
    }

    res.status(200).send('Please close this window to return to the conversation thread.');
    callSendAPI(body.psid, response);
});

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {

    // Gets the body of the webhook event
    let webhook_event = entry.messaging[0];
    console.log(webhook_event);

    // Get the sender PSID
    let sender_psid = webhook_event.sender.id;
    console.log('Sender PSID: ' + sender_psid);

    let lastMsgTimestamp = webhook_event.timestamp;

    if (webhook_event.message) {
      handleMessage(sender_psid, webhook_event.message);
    } else if (webhook_event.postback) {
      handlePostback(sender_psid, webhook_event.postback);
    }

  });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "EAAGuJTXP2QQBAMoWhL0zpguFTrajlWKUZCnmtZC676dzHAytGQZAeYKFdx8M05aM41lWAVtoSWWsDgLhwadgs7FhABnMILnBskWqXCI7qgA7JgliYDwU6j5XeFQG8Bw7O1QwfJR9FiFpudZAmy305VUO6ZCOXAyQgkYAeYzI2fgZDZD"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;

  if(received_message.text){
    switch (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase()) {
        case "login":
            response = login(sender_psid);
            break;
        default:
            response = {
                "text": `You sent the message: "${received_message.text}".`
            };
            break;
    }
  } else {
    response = {
        "text": 'Sorry, I don\'t understand what you mean. Do you want to talk to a real person?'
    }
  }
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

function login(sender_psid) {
  let request_body = {
    attachment: {
        type: "template",
        payload: {
            template_type: "button",
            text: "OK, let's log in to your Hong Leong Bank account first.",
            buttons: [{
                type: "web_url",
                url: "https://ahleong-kelvin.herokuapp.com/login",
                title: "Login",
                webview_height_ratio: "compact",
                messenger_extensions: true
            }]
        }
    }
  };

  return request_body;
  // Send the HTTP request to the Messenger Platform
  // request({
  //   "uri": "https://graph.facebook.com/v2.6/me/messages",
  //   "qs": { "access_token": PAGE_ACCESS_TOKEN },
  //   "method": "POST",
  //   "json": request_body
  // }, (err, res, body) => {
  //   if (!err) {
  //     console.log('message sent!')
  //   } else {
  //     console.error("Unable to send message:" + err);
  //   }
  // });
}
