const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//create
function create(req, res) {
  const newOrder = res.locals.newOrder;
  if (newOrder.id === undefined) newOrder.id = nextId();
  if (!newOrder.status) newOrder.status = "pending";
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
//read
function read(req, res) {
  const foundOrder = res.locals.foundOrder;
  return res.status(200).json({ data: foundOrder });
}

//update
function update(req, res) {
  const newOrder = res.locals.newOrder;
  if (!newOrder.id || newOrder.id === "") newOrder.id = req.params.orderId;
  return res.status(200).json({ data: newOrder });
}

//list

function list(req, res) {
  return res.status(200).json({ data: orders });
}

//orderExists

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.foundOrder = foundOrder;
    next();
  } else {
    next({
      status: 404,
      message: `order not found with id ${orderId}`,
    });
  }
}

//ordersmatch
function ordersmatch(req, res, next) {
  const foundOrder = res.locals.foundOrder;
  const newOrder = res.locals.newOrder;
  if (foundOrder.id === newOrder.id || !newOrder.id || newOrder.id === "") {
    next();
  } else {
    next({
      status: 400,
      message: ` orders must have the same id expected ${newOrder.id}to be${foundOrder.id}`,
    });
  }
}

function orderDoesNotExist(req, res, next) {
  const newOrder = res.locals.newOrder;
  const result = orders.filter((order) => order.id === newOrder.id);
  if (result.length > 0) {
    next({
      status: 405,
      message: `this is is already in use ${newOrder.id}`,
    });
  }
  next();
}

//delete
function destroy(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = res.locals.foundOrder;
  const index = orders.findIndex((order) => order.id === foundOrder.id);
  if (foundOrder.status !== "pending")
    next({
      status: 400,
      message: `status ${foundOrder.status} missing or invalid. only pending orders may be deleted. `,
    });

  if (index > -1) {
    orders.splice(index, 1);
  }
  res.status(204).json({ error: "deleted" });
}

function checkEachDish(dishes) {
  const missingProps = dishes.reduce((missing, dish, index) => {
    if (!dish.quantity || Number.isInteger(dish.quantity) != true)
      missing.push(
        `dish ${index} quantity ${dish.quantity} missing or invalid `
      );
    console.log("typeis", typeof dish.quantity);
    return missing;
  }, []);
  return missingProps;
}

function checkStatus(req, res, next) {
  status = res.locals.newOrder.status;
  if (!status || status === "invalid") {
    next({
      status: 400,
      message: `status ${status} missing or invalid `,
    });
  }
  next();
}

function checkProperties({ deliverTo, mobileNumber, status, dishes }) {
  const missing = [];
  if (!deliverTo) missing.push("deliverTo");
  if (!mobileNumber) missing.push("mobileNumber");
  if (!dishes || dishes.length <= 0 || Array.isArray(dishes) != true) {
    missing.push("dishes");
  } else {
    const dishCheck = checkEachDish(dishes);
    if (dishCheck != []) missing.push(dishCheck.join(","));
  }

  return missing.join(",");
}

//orderIsValid
function orderIsValid(req, res, next) {
  const {
    data: { id, deliverTo, mobileNumber, status, dishes } = {},
  } = req.body;
  //  if (name && description && price && image_url) {
  let newOrder = {
    id: id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  const missing = checkProperties(newOrder);
  if (missing.length === 0) {
    res.locals.newOrder = newOrder;
    next();
  } else {
    console.log("failed with", missing, newOrder);
    next({
      status: 400,
      message: `order is not valid missing: ${missing}`,
    });
  }
}

module.exports = {
  list,
  create: [orderIsValid, orderDoesNotExist, create],
  read: [orderExists, read],
  update: [orderExists, orderIsValid, ordersmatch, checkStatus, update],
  delete: [orderExists, destroy],
};
// TODO: Implement the /orderes handlers needed to make the tests pass
