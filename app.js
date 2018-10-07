'use strict';

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  PAGE_ACCESS_TOKEN = 'EAAP34enEWtgBAPSQUlztUAUsuwlGwlk9NBvpGOUGPPGG4juZCGgZCaP1Rzbt320oaJHvb7Ueb3eXBQvGscGL9fB0iiHWuRK9IGEZBJLnlOFxHX5Wm6B1x5I0vfJLsk5vffXNtSj2F4QkIFfOY2Dv1U1yxZC2lLfLZBuVwQ5YDZCgZDZD';

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

app.get('/pin', (req, res, next) => {
  let referer = req.get('Referer');
  if (referer) {
      if (referer.indexOf('www.messenger.com') >= 0) {
          res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
      } else if (referer.indexOf('www.facebook.com') >= 0) {
          res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
      }
      res.sendFile('pin.html', {root: __dirname});
  }
});

app.get('/login2', (req, res, next) => {
    let referer = req.get('Referer');
    if (referer) {
        if (referer.indexOf('www.messenger.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
        } else if (referer.indexOf('www.facebook.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
        }
        res.sendFile('login2.html', {root: __dirname});
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
app.get('/pinpostback', (req, res) => {
    let body = req.query; 
    if(logonCounter(sender_psid + '_db')>1){
       reward(sender_psid);
    }
    let response = { "text": 'Thank you for using our service!' };

    callSendAPI(body.psid, response);
});

app.post('/loginpostback', (req, res) => {
    let body = req.body;
    // console.log(body);
    // console.log(body.username);
    // console.log(body.password);
    // console.log(body.psid);
    let response;
    if( body.username === 'ali' && body.password === 'admin123' ){
      checkDB(body.psid + '_db');
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
        case '30':
          response = {
            "text": 'Hi Ali! Which account to view?',
              "quick_replies":[
                {
                    "content_type":"text",
                    "title":"Savings",
                    "payload":"SAVINGS",
                },
                {
                    "content_type":"text",
                    "title":"Current",
                    "payload":"CURRENT",
                }
              ]
          };
          break;
        case '31':
          response = {
            "text": 'Savings account:',
            // bal(sender_psid);
          };
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
  let VERIFY_TOKEN = "EAAP34enEWtgBAPSQUlztUAUsuwlGwlk9NBvpGOUGPPGG4juZCGgZCaP1Rzbt320oaJHvb7Ueb3eXBQvGscGL9fB0iiHWuRK9IGEZBJLnlOFxHX5Wm6B1x5I0vfJLsk5vffXNtSj2F4QkIFfOY2Dv1U1yxZC2lLfLZBuVwQ5YDZCgZDZD"
    
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
  let response1;

  if(readChainNo(sender_psid) == '29'){
    if(received_message.text.trim().match(/^[0-9]+$/) != null){
      addAccount(sender_psid + '_db', 'Beng', '6969420');
      logChainNo(sender_psid, '22');
    }else{
      response1 = {
        "text": 'Please enter numbers only.'
      };
      logChainNo(sender_psid, '29');
    }

}

  if(readChainNo(sender_psid) == '22'){
    if(checkIfSessionExists(sender_psid)){
      let recipient_name = received_message.text.replace(/[^\w\s]/gi, '').trim();
      if(readAccount(sender_psid + '_db', 'Beng')){
        logChainNo(sender_psid, '23');
        response1 = {
              "text": 'Recipient Name: ' + 'Beng' + ', ' + 'Account Number: 6969420' ,
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
      }else {
        logChainNo(sender_psid, '29');
        addAccount(sender_psid + '_db', 'Beng', '6969420');
        response1 = {
          "text": 'Recipient account not found in your contacts, please enter user account number.'
        }
    }
  }else{
      logChainNo(sender_psid, '21');
        response1 = {
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

  if(readChainNo(sender_psid) == '25'){
    response1 = {
      "text": 'Do yo want to set a reminder for this transaction?' ,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Yes",
            "payload":"YES",
          },
          {
            "content_type":"text",
            "title":"No",
            "payload":"NO",
          }
        ]
      };
  logChainNo(sender_psid, '26');
  }

  if(readChainNo(sender_psid) == '24'){
    if(received_message.text.trim().match(/^[0-9]+$/) != null){
      ;
      response1 = {
        "text": transferMoney(sender_psid + '_db', received_message.text.trim()) + 'Enter a description for this transaction.'
      };
      logChainNo(sender_psid, '25');
    }else{
      response1 = {
        "text": 'Please enter numbers only.'
      };
      logChainNo(sender_psid, '24');
    }
  }

if(readChainNo(sender_psid) == '25'){
  if(received_message.text.trim().match('rental') != null){
          response1 = {
          "text": 'Do yo want to set a reminder for this transaction?' ,
              "quick_replies":[
              {
                  "content_type":"text",
                  "title":"Yes",
                  "payload":"YES",
              },
              {
                  "content_type":"text",
                  "title":"No",
                  "payload":"NO",
              }
              ]
          };
          logChainNo(sender_psid, '26');
      } else{
          reponse1 = pin(sender_psid);
          logChainNo(sender_psid, '00');
      }
  }

  if(received_message.text){
    if(received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/balance|bal/gi) != null || received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase() == 'b'){
      if(checkIfSessionExists(sender_psid)){
        if(received_message.quick_reply){
              response = {
                "text": balanceAdder(balanceCounter(sender_psid + '_db'), sender_psid + '_db')
              };
            } else {
              response = {
                "text": balanceAdder(balanceCounter(sender_psid + '_db'), sender_psid + '_db')
              }
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
    } else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/account|acc/gi) != null){
      if(checkIfSessionExists(sender_psid)){
      response = {
          "text": 'Which account to view?',
            "quick_replies":[
              {
                  "content_type":"text",
                  "title":"Savings",
                  "payload":"SAVINGS",
              },
              {
                  "content_type":"text",
                  "title":"Current",
                  "payload":"CURRENT",
              }
            ]
          };
      }else{
      response = login(sender_psid);
      logChainNo(sender_psid, '30');
      }
    } else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/savings|saving/gi) != null){
      if(checkIfSessionExists(sender_psid)){
        response = {
          "text": 'Savings account:' + balanceAdder(balanceCounter(sender_psid + '_db'), sender_psid + '_db')
          };
      }else{
      response = login(sender_psid);
      logChainNo(sender_psid, '31');
      }
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
         
        checkDB(sender_psid + '_db');
        logonAdder(logonCounter(sender_psid + '_db'), sender_psid + '_db');
        
        logChainNo(sender_psid, '00');
      }
    }else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/transfer|pay/gi) != null){
      if(checkIfSessionExists(sender_psid)){
        response = {"text": 'Enter recipient name.'};
        //callSendAPI(sender_psid, response);
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
    }else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/remind/gi) != null){
      response = {
              "text": 'You reminder has been set.',
            };
      setTimeout(remind, 120000, sender_psid);
    } else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/yes|yea|yup|sure/gi) != null){
      if(readChainNo(sender_psid) == '23'){
        response = {
                "text": 'How much do you want to transfer?',
        };
        logChainNo(sender_psid, '24');
      } else if(readChainNo(sender_psid) == '26'){
        response = pin(sender_psid);
        logChainNo(sender_psid, '27');
      }
    }  else if(readChainNo(sender_psid) == '27'){
      //if pin number correct
      if(received_message.text.trim().match() != null){
          if(logonCounter(sender_psid + '_db')>1){
              reward(sender_psid);
          }
          response1 = {'text':'Thank you for talking to Ah Leong'};
      }
  } else if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase().match(/no|nope/gi) != null){
      if(readChainNo(sender_psid) == '26'){
        //response = pin(sender_psid);
        response = {"text": "What else I can help you?"};
        logChainNo(sender_psid, '00');
      }
    } else {
      response = {
        "text": 'I am sorry, I don\'t quite understand what you meant.'
      };

       if(readChainNo(sender_psid) == '44'){
        logChainNo(sender_psid, '444');
        response = {
          "text": 'Sorry, I am still very bad at this, should I get some help for you?'
        };
      }else if(readChainNo(sender_psid) == '444'){
          response = {
          //   "pass_thread_control":{
          //     "target_app_id":263902037430900,
          //     "metadata":"String to pass to secondary receiver app" 
          // },
            "text": 'Hi, I am Michael Lee Choon Sheng, what can I help you with?'
          };
          logChainNo(sender_psid, '4444');
      }
      if(readChainNo(sender_psid) == '44' && readChainNo(sender_psid) != '444'){
        logChainNo(sender_psid, '44');
      }

     
    }
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

  
  if(response1 != null){
    callSendAPI(sender_psid, response1);
  }else{
    callSendAPI(sender_psid, response);
  }
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

function login2(sender_psid) {
  let request_body = {
    attachment: {
        type: "template",
        payload: {
            template_type: "button",
            text: "OK, let's log in to your Hong Leong Bank account first.",
            buttons: [{
                type: "web_url",
                url: "https://ahleong-kelvin.herokuapp.com/login2",
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
  console.log(fs.existsSync(sender_psid + '-chain.json'));
  if(fs.existsSync(sender_psid + '-chain.json')){
    var jsonData = JSON.parse(fs.readFileSync(sender_psid + '-chain.json', 'utf8'));
      //var test = JSON.stringify(jsonData)
    console.log(jsonData);
    console.log(jsonData.table[0].chain);
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
  if(fs.existsSync(sender_psid + '-chain.json')){
    fs.unlinkSync(sender_psid + '-chain.json');
  }
  var obj = {
    table: []
  };

  obj.table.push({sender_id: sender_psid, timestamp: Date.now(), chain: chain_no});
  var json = JSON.stringify(obj);

  //fs = require('fs');
  fs.writeFileSync(sender_psid + '-chain.json', json);

}

function createSession(sender_psid) {
  var obj = {
    table: []
  };

  obj.table.push({sender_id: sender_psid, timestamp: Date.now(), failed_counter: 0});
  var json = JSON.stringify(obj);

  //var fs = require('fs');
  fs.writeFileSync(sender_psid + '.json', json);

}

function updateSessionFailed(sender_psid, new_failed_counter) {
  var obj = {
    table: []
  };

  obj.table.push({sender_id: sender_psid, timestamp: Date.now(), failed_counter: new_failed_counter});
  var json = JSON.stringify(obj);

  //var fs = require('fs');
  fs.writeFileSync(sender_psid + '.json', json);

}

function getFailedCounter(sender_psid) {
  console.log(fs.existsSync(sender_psid + '.json'));
  if(fs.existsSync(sender_psid + '.json')){
    var jsonData = JSON.parse(fs.readFileSync(sender_psid + '.json', 'utf8'));
      //var test = JSON.stringify(jsonData)
    console.log(jsonData);
    console.log(jsonData.table[0].failed_counter);
    if(jsonData.table[0].failed_counter){
      return jsonData.table[0].failed_counter;
    }else{
      return 0;
    }
  }else{
    
  }
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

function bal(sender_psid) {
  var jsonData = require('./' + sender_psid + '_db.json');
  //var test = JSON.stringify(jsonData)
  console.log(jsonData);
  //add frequency of action
  frequency = jsonData[3][0];
  frequency += 1; 
  if(jsonData.table[2][0]){
      if(frequency > 2){
        return {'text':"Your account balance is " + jsonData.table[2][0],
      'text':"Hi, you seem to check your balance a lot. You can type 'b' to check it quickly next time."};
      } else{
        return {'text':"Your account balance is " + jsonData.table[2][0]};
      }
  }else{
      return {'text':"Balance not found"};
  }
}

function reward(sender_psid) {
  callSendAPI(sender_psid, {"text":"Thanks for talking to Ah Leong", "sender_action":"typing_on"});
  callSendAPI(sender_psid, {"text":"Ah Leong will give you a pizza if you help me to make more friends!", "sender_action":"typing_on"});
  callSendAPI(sender_psid, share());
}

function share() {
  let request_body = {
      "type": "element_share",
      "share_contents": { 
          "attachment": {
          "type": "template",
          "payload": {
              "template_type": "generic",
              "elements": [
              {
                  "title": "Your friend just got a free pizza!",
                  "subtitle": "Ah Leong wants to make more friends",
                  "image_url": "https://cdn.pixabay.com/photo/2017/01/03/11/33/pizza-1949183_960_720.jpg",
                  "default_action": {
                  "type": "web_url",
                  "url": "http://m.me/ahleongmy"
                  },
                  "buttons": [
                  {
                      "type": "web_url",
                      "url": "http://m.me/ahleongmy", 
                      "title": "Claim the pizza"
                  }
                  ]
              }
              ]
              }
          }
      }   
  }   
  return request_body;
}

function createFile(filename) {

  var data =
    {
      "logon" : 0,
      "balance" : 1000,
      "frequency" : 0,
      "recepients" : {
          "acc" : "",
          "name": ""
        }
      };
  fs.writeFileSync(filename,JSON.stringify(data));
}

function checkDB(filename) {
  if (fs.existsSync(filename) == false) {
    createFile(filename);
  }
}

function logonCounter(filename) {

  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));
  //var data = Object.entries(data);
  console.log(data);
  return data.logon;

}

function logonAdder(checker,filename){

  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));
  var counter = data.logon+1;
  console.log(counter);

  data.logon=counter;

  console.log(JSON.stringify(data));
  fs.writeFileSync(filename,JSON.stringify(data));
  
  if (checker == 0) {
    callSendAPI(filename.split('_')[0], login(filename.split('_')[0]));
    console.log(filename.split('_')[0]);
  }
  else {
    callSendAPI(filename.split('_')[0], login2(filename.split('_')[0]));
    // login 2 here
    console.log(filename.split('_')[0]);
  }

}

function balanceCounter(filename){
  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));
  //var data = Object.entries(data);
  console.log(data);
  return data.frequency;
}

function balanceAdder(checker,filename){

  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));
  if (checker < 2) {

    var counter = data.frequency+1;
    data.frequency = counter;
    console.log(JSON.stringify(data));
    fs.writeFileSync(filename,JSON.stringify(data));
    return "Your account balance is " + data.balance;
  }
  else {
    data.frequency = 0;
    console.log(JSON.stringify(data));
    fs.writeFileSync(filename,JSON.stringify(data));
    return "Your account balance is " + data.balance + "Hi, you seem to check your balance a lot. You can type 'b' to check it quickly next time.";
  }
}

function transferMoney(filename,amount) {

  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));
  if (amount <= data.balance) {
    data.balance = data.balance - amount;
    console.log(JSON.stringify(data)+"TRANSACTION IS SUCCESSFUL!");
    fs.writeFileSync(filename,JSON.stringify(data));

    return 'The transaction is successful, theres is now' + data.balance +'in your account balance';
  }else{
    return 'Insufficient funds, transaction invalid!';
  }
}

function readAccount(filename, recepientsName) {

  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));

  if (data.recepients.name != recepientsName) {
    console.log("bar");
    return false
  }else{
    console.log("this is something else");
    return true
  }
}

function addAccount(filename, recepientsName, accountNumber){
  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));
  data.recepients.name = recepientsName;
  data.recepients.acc = accountNumber;
  console.log(JSON.stringify(data)+"ACCOUNT IS ADDED SUCCESSFULLY!");
  fs.writeFileSync(filename,JSON.stringify(data));

}

function remind(sender_psid) {
  let request_body = {
    "text": 'You bill for Ali is due tomorrow.'
  };
  callSendAPI(sender_psid, request_body);
}

function pin(sender_psid) {
  let request_body = {
    attachment: {
        type: "template",
        payload: {
            template_type: "button",
            text: "Please enter your PIN number",
            buttons: [{
                type: "web_url",
                url: "https://ahleong-kelvin.herokuapp.com/pin",
                title: "Pin",
                webview_height_ratio: "compact",
                messenger_extensions: true
            }]
        }
    }
  };
  return request_body;
}