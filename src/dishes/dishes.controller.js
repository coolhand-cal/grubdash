const { copyFile } = require("fs");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//create
function create(req, res) {
  const newDish = res.locals.newDish;
  if (newDish.id === undefined) newDish.id = nextId();
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}
//read
function read(req, res) {
  const foundDish = res.locals.foundDish;
  return res.status(200).json({ data: foundDish });
}

//update
function update(req, res) {
  const newDish = res.locals.newDish;
  if (!newDish.id || newDish.id === "") newDish.id = req.params.dishId;
  return res.status(200).json({ data: newDish });
}

//list

function list(req, res) {
  return res.status(200).json({ data: dishes });
}

//dishExists

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.foundDish = foundDish;
    next();
  } else {
    next({
      status: 404,
      message: `dish not found with id ${dishId}`,
    });
  }
}

//dishesmatch
function dishesmatch(req, res, next) {
  const foundDish = res.locals.foundDish;
  const newDish = res.locals.newDish;
  if (foundDish.id === newDish.id || !newDish.id || newDish.id === "") {
    next();
  } else {
    next({
      status: 400,
      message: ` dishes must have the same id expected ${newDish.id}to be${foundDish.id}`,
    });
  }
}

function dishDoesNotExist(req, res, next) {
  const newDish = res.locals.newDish;
  const result = dishes.filter((dish) => dish.id === newDish.id);
  if (result.length > 0) {
    next({
      status: 405,
      message: `this is is already in use ${newDish.id}`,
    });
  }
  next();
}

//delete
function destroy(req, res) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  const index = dishes.findIndex((dish) => dish.id === foundDish.id);
  if (index > -1) {
    console.log(`do1`);
    dishes.splice(index, 1);
  }
  res.status(405).json({ error: "deleted" });
}

function checkProperties({ name, description, price, image_url }) {
  const missing = [];
  if (!name) missing.push("name");
  if (!description) missing.push("description");
  if (!price || price <= 0 || typeof price != "number") missing.push("price");
  if (!image_url) missing.push("image_url");
  return missing.join(",");
}

//dishIsValid
function dishIsValid(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  //  if (name && description && price && image_url) {
  let newDish = {
    id: id,
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  const missing = checkProperties(newDish);
  if (missing.length === 0) {
    res.locals.newDish = newDish;
    next();
  } else {
    next({
      status: 400,
      message: `dish is not valid missing: ${missing}`,
    });
  }
}

module.exports = {
  list,
  create: [dishIsValid, dishDoesNotExist, create],
  read: [dishExists, read],
  update: [dishExists, dishIsValid, dishesmatch, update],
  delete: destroy,
};
// TODO: Implement the /dishes handlers needed to make the tests pass
