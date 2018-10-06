'use strict';

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  fs = require('fs'),
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

app.get('/location', (req, res, next) => {
    let referer = req.get('Referer');
    if (referer) {
        if (referer.indexOf('www.messenger.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
        } else if (referer.indexOf('www.facebook.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
        }
        res.sendFile('location.html', {root: __dirname});
    }
});

// Handle postback from webview
app.post('/loginpostback', (req, res) => {
    let body = req.body;
    // console.log(body);
    // console.log(body.username);
    // console.log(body.password);
    // console.log(body.psid);
    let response;
    if( body.username === 'admin' && body.password === 'admin123' ){
      switch(readChainNo(body.psid)){
        case '00':
          response = {
              "text": 'Hi Ali, how can I help you?',
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Check Balance",
                  "payload":"BAL",
                },
                {
                  "content_type":"text",
                  "title":"Transfer Money",
                  "payload":"TRANSFER_MONEY",
                },
                {
                  "content_type":"text",
                  "title":"View Account",
                  "payload":"VIEW_ACCOUNT",
                }
              ]
            };
          break;
        case '10':
          response = {
            "text": 'Hi Ali!',
            "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Cancel",
                  "payload":"CANCEL",
                }
              ]
          };
          callSendAPI(body.psid, {"text": "Your balance is 0! So poor!"});
          break;
        case '21':
          response = {
            "text": 'Hi Ali! Who do you want to transfer to?'
          }
          break;
        default:
          response = {
                "text": 'Hi Ali, how can I help you ? ',
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Quick Balance",
                    "payload":"BAL",
                  }
                ]
              };
    }
      //console.log(checkIfSessionExists(body.psid));
      if(checkIfSessionExists(body.psid)){
           fs.unlinkSync(body.psid + '.json');
           createSession(body.psid);
           logChainNo(body.psid, '00');
        }else{
          createSession(body.psid);
          logChainNo(body.psid, '00');
        }
    }else{
      response = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Login Failed. Please try again.",
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
    if(received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/balance|bal/gi) != null){
      if(checkIfSessionExists(sender_psid)){
        if(received_message.quick_reply){
              response = {
                "text": 'Your balance is 0! So poor!',
              };
            } else {
              response = {"text": "Your balance is 0! So poor!"};
          }
        } else {
          logChainNo(sender_psid, '10');
          response = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Please log in to proceed.",
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
        }
        //callSendAPI(sender_psid, response);
    } else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/login|log in/gi) != null){
      if(checkIfSessionExists(sender_psid)){
        response = {
          "text": 'It seems like you have already logged into an account, do you want to log out?',
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Logout",
                  "payload":"LOGOUT",
                }
              ]
            };
      }else{
        response = login(sender_psid);
        logChainNo(sender_psid, '00');
      }
    }else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/transfer|pay/gi) != null){
      if(checkIfSessionExists(sender_psid)){
        response = {"text": 'Enter recipient name.'};
        logChainNo(sender_psid, '22');
      }else{
        logChainNo(sender_psid, '21');
        response = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Please log in to proceed.",
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
      }
    }else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/logout|log out|logoff|log off/gi) != null){
      if(checkIfSessionExists(sender_psid)){
        logout(sender_psid);
        response = {
          "text": 'You have logged out successfully. Thank you.',
            };
      }else{
        response = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "You have not logged into any account. Do you mean to log in?",
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
      }
    } else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/atm/gi) != null){
      response = showLocation(); 
    } else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/cancel/gi) != null){
      response = {
              "text": 'Hi Ali, how can I help you?',
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Check Balance",
                  "payload":"BAL",
                },
                {
                  "content_type":"text",
                  "title":"Transfer Money",
                  "payload":"TRANSFER_MONEY",
                },
                {
                  "content_type":"text",
                  "title":"View Account",
                  "payload":"VIEW_ACCOUNT",
                }
              ]
            };
      logChainNo(sender_psid, '00');
    }else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/hi|hai|hello|hey/gi) != null){
      response = {
              "text": 'How can I help you?',
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Login",
                  "payload":"LOGIN",
                },
                {
                  "content_type":"text",
                  "title":"Quick Balance",
                  "payload":"BAL",
                }
              ]
            };
    } else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/yes|yea|yup|sure/gi) != null){
      if(readChainNo(sender_psid) === '23'){
        response = {
                "text": 'How much do you want to transfer?',
        };
        logChainNo(sender_psid, '24');
      } else if(readChainNo(sender_psid) === '26'){
        response = {
                "text": 'Alright, the reminder has been set.',
                "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Check Balance",
                  "payload":"BAL",
                },
                {
                  "content_type":"text",
                  "title":"Transfer Money",
                  "payload":"TRANSFER_MONEY",
                },
                {
                  "content_type":"text",
                  "title":"View Account",
                  "payload":"VIEW_ACCOUNT",
                }
              ]
        };
        logChainNo(sender_psid, '00');
      }
    }else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/no|nope/gi) != null){
      if(readChainNo(sender_psid) === '26'){
        response = {
                "text": 'Alright, no reminder is set.',
                "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Check Balance",
                  "payload":"BAL",
                },
                {
                  "content_type":"text",
                  "title":"Transfer Money",
                  "payload":"TRANSFER_MONEY",
                },
                {
                  "content_type":"text",
                  "title":"View Account",
                  "payload":"VIEW_ACCOUNT",
                }
              ]
        };
        logChainNo(sender_psid, '00');
      }
    } else {
      response = {
        "text": 'Sorry, I don\'t understand what you mean. Do you want to talk to a real person?'
      }
    };
  }
  //   switch (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase()) {
  //       case "login":
  //           response = login(sender_psid);
  //           break;
  //       case "hi":
  //           response = {
  //             "text": 'How can I help you?',
  //             "quick_replies":[
  //               {
  //                 "content_type":"text",
  //                 "title":"Login",
  //                 "payload":"LOGIN",
  //               },
  //               {
  //                 "content_type":"text",
  //                 "title":"Quick Balance",
  //                 "payload":"BAL",
  //               }
  //             ]
  //           };
  //           break;
  //       //case "bal":
  //       case "quickbalance":
  //         if(received_message.quick_reply){
  //           response = {
  //             "text": 'Your balance is 0! So poor!',
  //             "quick_replies":[
  //               {
  //                 "content_type":"text",
  //                 "title":"Login",
  //                 "payload":"LOGIN",
  //               }
  //             ]
  //           };
  //         } else {
  //           response = {"text": "Your balance is 0! So poor!"};
  //       }
  //           break;
  //       default:
  //           response = {
  //               "text": `You sent the message: "${received_message.text}".`
  //           };
  //           break;
  //   }
  // }else {
  //   response = {
  //       "text": 'Sorry, I don\'t understand what you mean. Do you want to talk to a real person?'
  //   }
  // }

  if(readChainNo(sender_psid) === '22'){
    if(checkIfSessionExists(sender_psid)){
      let recipient_name = received_message.text.replace(/[^\w\s]/gi, '').trim();
      if(checkIfAccNoExists()){
        logChainNo(sender_psid, '23');
        response = {
              "text": 'Recipient Name: ' + recipent_name + ', ' + 'Account Number: 1293800023983' ,
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Yes",
                  "payload":"YES",
                },
                {
                  "content_type":"text",
                  "title":"Cancel",
                  "payload":"CANCEL",
                }
              ]
            };
      }
    }else{
      logChainNo(sender_psid, '21');
        response = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Please log in to proceed.",
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
    }
  }

  if(readChainNo(sender_psid) === '24'){
    if(string.match(/^[0-9]+$/) != null){
      response = {
              "text": 'Enter a description for this transaction.'
      };
      logChainNo(sender_psid, '25');
    }else{
      response = {
              "text": 'Please enter numbers only.'
      };
      logChainNo(sender_psid, '24');
    }
  }

  if(readChainNo(sender_psid) === '25'){
    response = {
      "text": 'Do yo want to set a reminder for this transaction?' ,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Yes",
            "payload":"YES",
          },
          {
            "content_type":"text",
            "title":"Cancel",
            "payload":"NO",
          }
        ]
      };
  logChainNo(sender_psid, '26');
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

function showLocation(){
  let request_body = {
    attachment: {
        type: "template",
        payload: {
            template_type: "button",
            text: "Here are the nearest ATM locations.",
            buttons: [{
                type: "web_url",
                url: "https://ahleong-kelvin.herokuapp.com/location",
                title: "Show Locations",
                webview_height_ratio: "compact",
                messenger_extensions: true
            }]
        }
    }
  };

  return request_body;
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
                webview_height_ratio: "tall",
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

function readChainNo(sender_psid){
  if(fs.existsSync(sender_psid + '-chain.json')){
    var jsonData = require('./' + sender_psid + '-chain.json');
    //var test = JSON.stringify(jsonData)
    console.log(jsonData);
    //console.log(test.table[0].chain);
    if(jsonData.table[0].chain){
      return jsonData.table[0].chain;
    }else{
      return '00';
    }
  }else{
    logChainNo(sender_psid, '00');
    return '00';
  }
}

function logChainNo(sender_psid, chain_no){
  var obj = {
    table: []
  };

  obj.table.push({sender_id: sender_psid, timestamp: Date.now(), chain: chain_no});
  var json = JSON.stringify(obj);

  var fs = require('fs');
  fs.writeFileSync(sender_psid + '-chain.json', json);

}

function createSession(sender_psid) {
  var obj = {
    table: []
  };

  obj.table.push({sender_id: sender_psid, timestamp: Date.now()});
  var json = JSON.stringify(obj);

  //var fs = require('fs');
  fs.writeFileSync(sender_psid + '.json', json);

}

function checkIfSessionExists(sender_psid){

  // fs.stat('/' + sender_psid + '.json', function(err) {
  //   if (!err) {
  //     return true;
  //     console.log('file or directory exists');
  //   }
  //   else if (err.code === 'ENOENT') {
  //     return false;
  //      console.log('file or directory does not exist');
  //   }
  //   else{
  //     console.log('err' + err.code);
  //     return false;
  //   }
  // });
  return fs.existsSync(sender_psid + '.json');

}

function logout(sender_psid){
  fs.unlinkSync(sender_psid + '.json');
}

function checkIfAccNoExists(){
  return true;
}