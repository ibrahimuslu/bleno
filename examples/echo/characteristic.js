var util = require('util');
var fs = require('fs');
var bleno = require('../..');
const { exec } = require('child_process');

var BlenoCharacteristic = bleno.Characteristic;

var EchoCharacteristic = function() {
  EchoCharacteristic.super_.call(this, {
    uuid: 'ec0e',
    properties: ['read', 'write', 'notify'],
    value: null
  });

  this._value = new Buffer(0);
  this._updateValueCallback = null;
};

util.inherits(EchoCharacteristic, BlenoCharacteristic);

EchoCharacteristic.prototype.onReadRequest = function(offset, callback) {
  callback(this.RESULT_SUCCESS, this._value);
};

EchoCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  this._value = data;

  console.log('EchoCharacteristic - onWriteRequest: value = ' + this._value.toString('hex'));
  fs.writeFile('/etc/wpa_supplicant/wpa_supplicant.conf', this._value, function (err) {
    if (err) 
        return console.log(err);
  });
  console.log(this._value+ "written to file wpa_supplicant.conf" );
  exec('sudo wpa_supplicant -iwlan0 -c/etc/wpa_supplicant/wpa_supplicant.conf',(error,stdout,stderr)=>{
    if(error){
      console.error('exec error: ${error}');
      return;
    }
    console.log('wifi Successfully setted up!')
    exec('ifdown wlan0 & ifup wlan0', (error, stdout, stderr) => {
      if (error) {
        console.error('exec error: ${error}');
        return;
      }
      console.log('stdout: ${stdout}');
      console.log('stderr: ${stderr}');
    });

  });
  if (this._updateValueCallback) {
    console.log('EchoCharacteristic - onWriteRequest: notifying');

    this._updateValueCallback(this._value);
  }

  callback(this.RESULT_SUCCESS);
};

EchoCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('EchoCharacteristic - onSubscribe');

  this._updateValueCallback = updateValueCallback;
};

EchoCharacteristic.prototype.onUnsubscribe = function() {
  console.log('EchoCharacteristic - onUnsubscribe');

  this._updateValueCallback = null;
};

module.exports = EchoCharacteristic;

