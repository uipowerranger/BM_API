const rapid = require("eway-rapid");

var key =
    "F9802CQJVbYLvDZXPdzYhPsTdIN00OfdRJZ6qVTv8kbRAArtuGpJWkcTZBlPZxMMfuAlNP",
  password = "wBV6Abrx",
  endpoint = "sandbox";

var client = rapid.createClient(key, password, endpoint);

exports.getAccessCode = (AccessCode) => {
  return client.queryTransaction(AccessCode);
};

exports.payment = (data) => {
  return client.createTransaction(rapid.Enum.Method.RESPONSIVE_SHARED, {
    ...data,
    // Change these to your server
    RedirectUrl: "birlamart://thanks",
    CancelUrl: "birlamart://transactionfailed",
    TransactionType: "Purchase",
  });
};
