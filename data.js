'use strict'

const fs = require('fs');

function createFile(filename) {

  var data =
    {
      "sender_psid" : "",
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

  if (checker == 0) {
    // login 1 here
    console.log("apple");
  }
  else {
    // login 2 here
    console.log("bear");
  }

  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));
  var counter = data.logon+1;
  console.log(counter);

  data.logon=counter;

  console.log(JSON.stringify(data));
  fs.writeFileSync(filename,JSON.stringify(data));

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
    return {'text':"Your account balance is " + data.balance};
  }
  else {
    data.frequency = 0;
    console.log(JSON.stringify(data));
    fs.writeFileSync(filename,JSON.stringify(data));
    return {'text':"Your account balance is " + data.balance,
      'text':"Hi, you seem to check your balance a lot. You can type 'b' to check it quickly next time."};
  }
}

function transferMoney(filename,amount) {

  var data = JSON.parse(fs.readFileSync(filename,'utf-8'));
  if (amount <= data.balance) {
    data.balance = data.balance - amount;
    console.log(JSON.stringify(data)+"TRANSACTION IS SUCCESSFUL!");
    fs.writeFileSync(filename,JSON.stringify(data));

    return {'text': 'The transaction is successful, theres is now' + data.balance +'in your account balance'}
  }else{
    return {'text':'Insufficient funds, transaction invalid!'}
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
checkDB('test.json');
//logonAdder(logonCounter('test.json'),'test.json')
//balanceAdder(balanceCounter('test.json'),'test.json')
//transferMoney('test.json', 300);
if (readAccount('test.json','meng') == false) {
  addAccount('test.json','meng','123456');
}
//addRecipient('test.json');