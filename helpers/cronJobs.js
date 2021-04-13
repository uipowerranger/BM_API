var CronJob = require("cron").CronJob;
var AdminModel = require("../models/AdminModel");
var OrderModel = require("../models/OrderModel");
var mongoose = require("mongoose");
var mailer = require("./mailer");
var moment = require("moment");

var enumerateDaysBetweenDates = (startDate, endDate) => {
  var dates = [];
  dates.push({
    fdate: moment().format("YYYY-MM-DD"),
    tdate: moment().format("YYYY-MM-DD"),
  });
  dates.push({
    fdate: moment(startDate).format("YYYY-MM-DD"),
    tdate: moment(endDate).format("YYYY-MM-DD"),
  });
  let mm = moment().month() + 1;
  let month = mm < 10 ? "0" + mm : mm;
  dates.push({
    fdate: moment().year() + "-" + month + "-01",
    tdate: moment().year() + "-" + month + "-31",
  });
  return dates;
};

exports.start = async () => {
  console.log("Cron job init start");
  const dailyJob = new CronJob(
    "00 00 * * *",
    function () {
      let from_date = "2021-01-01";
      let to_date = "2021-01-01";
      let dateData = {
        from_date: moment()
          .day("Sunday")
          .year(moment().year())
          .week(moment().week())
          .format("YYYY-MM-DD"),
        to_date: moment()
          .day("Saturday")
          .year(moment().year())
          .week(moment().week())
          .format("YYYY-MM-DD"),
      };
      let dates = enumerateDaysBetweenDates(
        dateData.from_date,
        dateData.to_date
      );
      if (dates.length > 0) {
        from_date = dates[0].fdate;
        to_date = dates[0].tdate;
      }
      AdminModel.find({ status: 1 })
        .then((data) => {
          if (data.length > 0) {
            let admins = [];
            let stateAdmins = [];
            data.map((a) => {
              if (a.role === "admin") {
                admins.push(a.email_id);
              } else if (a.role === "state_admin") {
                let existId = stateAdmins.findIndex((e) => {
                  return e.state_id.equals(a.assign_state);
                });
                if (existId === -1) {
                  stateAdmins.push({
                    state_id: a.assign_state,
                    email: [a.email_id],
                  });
                } else {
                  stateAdmins[existId].email.push(a.email_id);
                }
              }
            });
            if (stateAdmins.length > 0) {
              let stateData = stateAdmins.map(async (s) => {
                return await new Promise(async (resolve, rejects) => {
                  await OrderModel.aggregate([
                    {
                      $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user_details",
                      },
                    },
                    {
                      $unwind: "$user_details",
                    },
                    {
                      $lookup: {
                        from: "states",
                        localField: "state_details",
                        foreignField: "_id",
                        as: "order_state",
                      },
                    },
                    {
                      $unwind: "$order_state",
                    },
                    {
                      $match: {
                        state_details: mongoose.Types.ObjectId(s.state_id),
                        order_date: {
                          $gte: new Date(
                            new Date(from_date).setHours(00, 00, 00)
                          ),
                          $lt: new Date(new Date(to_date).setHours(23, 59, 59)),
                        },
                      },
                    },
                    {
                      $project: {
                        order_date: 1,
                        payment: 1,
                        order_completed: 1,
                        total_amount: 1,
                        email_id: 1,
                        phone_number: 1,
                        "user_details.first_name": 1,
                        "user_details.last_name": 1,
                        "order_state.state_name": 1,
                      },
                    },
                  ])
                    .then((resp) =>
                      resolve({
                        mailer: s.email,
                        data: resp,
                      })
                    )
                    .catch((err) => rejects([]));
                });
              });

              Promise.allSettled(stateData)
                .then((stateDataReport) => {
                  if (!!stateDataReport && stateDataReport.length > 0) {
                    stateDataReport.map((odata) => {
                      if (odata.status === "fulfilled") {
                        // console.log(odata.value);
                      }
                    });
                  }

                  if (!!stateDataReport && stateDataReport.length > 0) {
                    stateDataReport.map((odata) => {
                      if (odata.status === "fulfilled") {
                        let state =
                          !!odata.value.data[0] &&
                          !!odata.value.data[0].order_state
                            ? odata.value.data[0].order_state.state_name
                            : "";
                        let html = `<p>Order summary details for state <b>${state}</b></p><p></p>`;
                        html =
                          html +
                          "<table width='900px' border='1' cellspacing='0'><thead><tr><th>Order Id</th><th>Order Date</th><th>User</th><th>Email</th><th>Amount</th><th>Payment Status</th><th>Order Status</th></tr></thead><tbody>";
                        let orders = odata.value.data.map((o) => {
                          var user = !!o.user_details
                            ? o.user_details.first_name +
                              " " +
                              o.user_details.last_name
                            : "";
                          var pay_status = o.payment ? "Completed" : "Pending";
                          var order_status = o.order_completed
                            ? "Completed"
                            : "Pending";
                          return (
                            "<tr><td>" +
                            o._id +
                            "</td><td style='align-items:center'>" +
                            new Date(o.order_date).toLocaleString() +
                            "</td><td style='align-items:center'>" +
                            user +
                            "</td><td style='align-items:center'>" +
                            o.email_id +
                            "</td><td style='align-items:center'>" +
                            o.total_amount +
                            "</td><td style='align-items:center'>" +
                            pay_status +
                            "</td><td style='align-items:center'>" +
                            order_status +
                            "</td></tr>"
                          );
                        });
                        html = html + orders.join("");
                        html =
                          html +
                          "</tbody></table><p>Thanks,</p><p>BirlaMart</p>";
                        let ccadmin = admins.join();
                        let toadmins = odata.value.mailer.join();
                        let subject = `Order summary report ${state} from ${from_date} to ${to_date}`;
                        if (!!odata.value.data[0]) {
                          mailer
                            .sendReport(toadmins, ccadmin, subject, html)
                            .then(function (mailresp) {
                              console.log(mailresp.messageId);
                            })
                            .catch(function (mailerr) {
                              console.log(mailerr);
                            });
                        }
                      }
                    });
                  } else {
                    console.log("no data");
                  }
                })
                .catch((err) => console.log(err));
            }
          }
        })
        .catch((error) => console.log(error));
    },
    null,
    true,
    "Asia/Kolkata"
  ).start();

  const weekJob = new CronJob(
    "00 01 * * 1",
    function () {
      let from_date = "2021-01-01";
      let to_date = "2021-01-01";
      let dateData = {
        from_date: moment()
          .day("Sunday")
          .year(moment().year())
          .week(moment().week())
          .format("YYYY-MM-DD"),
        to_date: moment()
          .day("Saturday")
          .year(moment().year())
          .week(moment().week())
          .format("YYYY-MM-DD"),
      };
      let dates = enumerateDaysBetweenDates(
        dateData.from_date,
        dateData.to_date
      );
      if (dates.length > 0) {
        from_date = dates[1].fdate;
        to_date = dates[1].tdate;
      }
      AdminModel.find({ status: 1 })
        .then((data) => {
          if (data.length > 0) {
            let admins = [];
            let stateAdmins = [];
            data.map((a) => {
              if (a.role === "admin") {
                admins.push(a.email_id);
              } else if (a.role === "state_admin") {
                let existId = stateAdmins.findIndex((e) => {
                  return e.state_id.equals(a.assign_state);
                });
                if (existId === -1) {
                  stateAdmins.push({
                    state_id: a.assign_state,
                    email: [a.email_id],
                  });
                } else {
                  stateAdmins[existId].email.push(a.email_id);
                }
              }
            });
            if (stateAdmins.length > 0) {
              let stateData = stateAdmins.map(async (s) => {
                return await new Promise(async (resolve, rejects) => {
                  await OrderModel.aggregate([
                    {
                      $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user_details",
                      },
                    },
                    {
                      $unwind: "$user_details",
                    },
                    {
                      $lookup: {
                        from: "states",
                        localField: "state_details",
                        foreignField: "_id",
                        as: "order_state",
                      },
                    },
                    {
                      $unwind: "$order_state",
                    },
                    {
                      $match: {
                        state_details: mongoose.Types.ObjectId(s.state_id),
                        order_date: {
                          $gte: new Date(
                            new Date(from_date).setHours(00, 00, 00)
                          ),
                          $lt: new Date(new Date(to_date).setHours(23, 59, 59)),
                        },
                      },
                    },
                    {
                      $project: {
                        order_date: 1,
                        payment: 1,
                        order_completed: 1,
                        total_amount: 1,
                        email_id: 1,
                        phone_number: 1,
                        "user_details.first_name": 1,
                        "user_details.last_name": 1,
                        "order_state.state_name": 1,
                      },
                    },
                  ])
                    .then((resp) =>
                      resolve({
                        mailer: s.email,
                        data: resp,
                      })
                    )
                    .catch((err) => rejects([]));
                });
              });

              Promise.allSettled(stateData)
                .then((stateDataReport) => {
                  if (!!stateDataReport && stateDataReport.length > 0) {
                    stateDataReport.map((odata) => {
                      if (odata.status === "fulfilled") {
                        // console.log(odata.value);
                      }
                    });
                  }

                  if (!!stateDataReport && stateDataReport.length > 0) {
                    stateDataReport.map((odata) => {
                      if (odata.status === "fulfilled") {
                        let state =
                          !!odata.value.data[0] &&
                          !!odata.value.data[0].order_state
                            ? odata.value.data[0].order_state.state_name
                            : "";
                        let html = `<p>Order summary details for state <b>${state}</b></p><p></p>`;
                        html =
                          html +
                          "<table width='900px' border='1' cellspacing='0'><thead><tr><th>Order Id</th><th>Order Date</th><th>User</th><th>Email</th><th>Amount</th><th>Payment Status</th><th>Order Status</th></tr></thead><tbody>";
                        let orders = odata.value.data.map((o) => {
                          var user = !!o.user_details
                            ? o.user_details.first_name +
                              " " +
                              o.user_details.last_name
                            : "";
                          var pay_status = o.payment ? "Completed" : "Pending";
                          var order_status = o.order_completed
                            ? "Completed"
                            : "Pending";
                          return (
                            "<tr><td>" +
                            o._id +
                            "</td><td style='align-items:center'>" +
                            new Date(o.order_date).toLocaleString() +
                            "</td><td style='align-items:center'>" +
                            user +
                            "</td><td style='align-items:center'>" +
                            o.email_id +
                            "</td><td style='align-items:center'>" +
                            o.total_amount +
                            "</td><td style='align-items:center'>" +
                            pay_status +
                            "</td><td style='align-items:center'>" +
                            order_status +
                            "</td></tr>"
                          );
                        });
                        html = html + orders.join("");
                        html =
                          html +
                          "</tbody></table><p>Thanks,</p><p>BirlaMart</p>";
                        let ccadmin = admins.join();
                        let toadmins = odata.value.mailer.join();
                        let subject = `Order summary report ${state} from ${from_date} to ${to_date}`;
                        if (!!odata.value.data[0]) {
                          mailer
                            .sendReport(toadmins, ccadmin, subject, html)
                            .then(function (mailresp) {
                              console.log(mailresp.messageId);
                            })
                            .catch(function (mailerr) {
                              console.log(mailerr);
                            });
                        }
                      }
                    });
                  } else {
                    console.log("no data");
                  }
                })
                .catch((err) => console.log(err));
            }
          }
        })
        .catch((error) => console.log(error));
    },
    null,
    true,
    "Asia/Kolkata"
  ).start();

  const monthJob = new CronJob(
    "00 02 1 * *",
    function () {
      let from_date = "2021-01-01";
      let to_date = "2021-01-01";
      let dateData = {
        from_date: moment()
          .day("Sunday")
          .year(moment().year())
          .week(moment().week())
          .format("YYYY-MM-DD"),
        to_date: moment()
          .day("Saturday")
          .year(moment().year())
          .week(moment().week())
          .format("YYYY-MM-DD"),
      };
      let dates = enumerateDaysBetweenDates(
        dateData.from_date,
        dateData.to_date
      );
      if (dates.length > 0) {
        from_date = dates[2].fdate;
        to_date = dates[2].tdate;
      }
      AdminModel.find({ status: 1 })
        .then((data) => {
          if (data.length > 0) {
            let admins = [];
            let stateAdmins = [];
            data.map((a) => {
              if (a.role === "admin") {
                admins.push(a.email_id);
              } else if (a.role === "state_admin") {
                let existId = stateAdmins.findIndex((e) => {
                  return e.state_id.equals(a.assign_state);
                });
                if (existId === -1) {
                  stateAdmins.push({
                    state_id: a.assign_state,
                    email: [a.email_id],
                  });
                } else {
                  stateAdmins[existId].email.push(a.email_id);
                }
              }
            });
            if (stateAdmins.length > 0) {
              let stateData = stateAdmins.map(async (s) => {
                return await new Promise(async (resolve, rejects) => {
                  await OrderModel.aggregate([
                    {
                      $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user_details",
                      },
                    },
                    {
                      $unwind: "$user_details",
                    },
                    {
                      $lookup: {
                        from: "states",
                        localField: "state_details",
                        foreignField: "_id",
                        as: "order_state",
                      },
                    },
                    {
                      $unwind: "$order_state",
                    },
                    {
                      $match: {
                        state_details: mongoose.Types.ObjectId(s.state_id),
                        order_date: {
                          $gte: new Date(
                            new Date(from_date).setHours(00, 00, 00)
                          ),
                          $lt: new Date(new Date(to_date).setHours(23, 59, 59)),
                        },
                      },
                    },
                    {
                      $project: {
                        order_date: 1,
                        payment: 1,
                        order_completed: 1,
                        total_amount: 1,
                        email_id: 1,
                        phone_number: 1,
                        "user_details.first_name": 1,
                        "user_details.last_name": 1,
                        "order_state.state_name": 1,
                      },
                    },
                  ])
                    .then((resp) =>
                      resolve({
                        mailer: s.email,
                        data: resp,
                      })
                    )
                    .catch((err) => rejects([]));
                });
              });

              Promise.allSettled(stateData)
                .then((stateDataReport) => {
                  if (!!stateDataReport && stateDataReport.length > 0) {
                    stateDataReport.map((odata) => {
                      if (odata.status === "fulfilled") {
                        // console.log(odata.value);
                      }
                    });
                  }

                  if (!!stateDataReport && stateDataReport.length > 0) {
                    stateDataReport.map((odata) => {
                      if (odata.status === "fulfilled") {
                        let state =
                          !!odata.value.data[0] &&
                          !!odata.value.data[0].order_state
                            ? odata.value.data[0].order_state.state_name
                            : "";
                        let html = `<p>Order summary details for state <b>${state}</b></p><p></p>`;
                        html =
                          html +
                          "<table width='900px' border='1' cellspacing='0'><thead><tr><th>Order Id</th><th>Order Date</th><th>User</th><th>Email</th><th>Amount</th><th>Payment Status</th><th>Order Status</th></tr></thead><tbody>";
                        let orders = odata.value.data.map((o) => {
                          var user = !!o.user_details
                            ? o.user_details.first_name +
                              " " +
                              o.user_details.last_name
                            : "";
                          var pay_status = o.payment ? "Completed" : "Pending";
                          var order_status = o.order_completed
                            ? "Completed"
                            : "Pending";
                          return (
                            "<tr><td>" +
                            o._id +
                            "</td><td style='align-items:center'>" +
                            new Date(o.order_date).toLocaleString() +
                            "</td><td style='align-items:center'>" +
                            user +
                            "</td><td style='align-items:center'>" +
                            o.email_id +
                            "</td><td style='align-items:center'>" +
                            o.total_amount +
                            "</td><td style='align-items:center'>" +
                            pay_status +
                            "</td><td style='align-items:center'>" +
                            order_status +
                            "</td></tr>"
                          );
                        });
                        html = html + orders.join("");
                        html =
                          html +
                          "</tbody></table><p>Thanks,</p><p>BirlaMart</p>";
                        let ccadmin = admins.join();
                        let toadmins = odata.value.mailer.join();
                        let subject = `Order summary report ${state} from ${from_date} to ${to_date}`;
                        if (!!odata.value.data[0]) {
                          mailer
                            .sendReport(toadmins, ccadmin, subject, html)
                            .then(function (mailresp) {
                              console.log(mailresp.messageId);
                            })
                            .catch(function (mailerr) {
                              console.log(mailerr);
                            });
                        }
                      }
                    });
                  } else {
                    console.log("no data");
                  }
                })
                .catch((err) => console.log(err));
            }
          }
        })
        .catch((error) => console.log(error));
    },
    null,
    true,
    "Asia/Kolkata"
  ).start();
};
