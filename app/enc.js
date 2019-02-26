

var aesjs = require('aes-js')
var md5 = require('react-native-md5')
var Buffer = require('buffer/').Buffer

var key = "hello"
var keyhash = md5.hex_md5(key)
var keyb = Buffer.from(keyhash, 'hex')
console.log(key, keyhash, keyb)
var iv = []
for(var i=0; i < 16; i++)
  iv.push(Math.floor(Math.random() * 100))

function pad(text) {
  txt = text
  for(i=0; i < (32 - text.length % 32); i++)
    txt += String.fromCharCode(32 - text.length % 32)
  return txt
}

var text = 'TextMustBe16Byte';
var textBytes = aesjs.utils.utf8.toBytes(pad(text))

var aesCbc = new aesjs.ModeOfOperation.cbc(keyb, iv)
var encryptedBytes = aesCbc.encrypt(textBytes);
var enc64 = Buffer.concat([Buffer.from(iv), Buffer(encryptedBytes)]).toString("base64")
console.log(enc64)
