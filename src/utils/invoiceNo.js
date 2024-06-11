const invoiceNo = () => {
 const date = new Date(); // Replace with your desired date
 const options = {
   timeZone: "America/New_York",
   year: "numeric",
   month: "2-digit",
   day: "2-digit",
 };
 const usDateFormat = date.toLocaleString("en-US", options);
 const [day,month, year] = usDateFormat.split("/");
 const otp = Math.floor(10000 + Math.random() * 90000);
 const formate=`${year}-${month}-${otp}`
  return formate;
};
module.exports = invoiceNo;
