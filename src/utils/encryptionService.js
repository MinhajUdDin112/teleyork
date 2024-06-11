const CryptoJS = require("crypto-js");
const cryptkey = CryptoJS.enc.Utf8.parse(process.env.CRYPTKEY);
const cryptiv = CryptoJS.enc.Utf8.parse(process.env.CRYPTIV);
const encryption = async (data) => {
  var encrypt = CryptoJS.AES.encrypt(JSON.stringify(data), cryptkey, {
    iv: cryptiv,
    mode: CryptoJS.mode.CTR,
  });
  const cipher = encrypt.toString();
  console.log(cipher);
  return cipher;
};
const decryption = async (data) => {
  const crypted = CryptoJS.enc.Base64.parse(data.toString()); //"Zt8VfHQqiKj/MToZGwWppw==");
  var decrypt = CryptoJS.AES.decrypt({ ciphertext: crypted }, cryptkey, {
    iv: cryptiv,
    mode: CryptoJS.mode.CTR,
  });
  // console.log(decrypt);
  const data2 = decrypt.toString(CryptoJS.enc.Utf8);
  if (data2) return JSON.parse(data2);
  return null;
};

module.exports = { encryption };
