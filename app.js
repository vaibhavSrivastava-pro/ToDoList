//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require('path');
const _ = require("lodash");



const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
mongoose.connect("mongodb+srv://Vaibhav:jyotisadhana@cluster0.eugvoof.mongodb.net/todolistdb", {
  usenewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.once('connected', () => {
  console.log('mongodb is connected');
});

const itemsSchema = new mongoose.Schema({
  name: String 
}); 

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Web dev"
});

const item2 = new Item({
  name: "Unity"
});

const item3 = new Item({
  name: "DSA"
});



const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res){
  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err)
          } else {
            console.log('Successfully saved default items to DB.')
          }
        });
        res.redirect('/');
      } else {
        res.render('list', {listTitle: 'Today', newListItems: foundItems});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name: listName}, function(err, foundList){
      if(foundList!=null)
      {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
      else
      {
        res.redirect("/");
      }
    });
  }

  

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function(err, foundList) {
    if (!err) {
      if (customListName === "About") {
        res.render("about");
      } else if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today")
  {
    Item.findByIdAndRemove(checkedItemId, function(err){
    if(err) console.log(err);
    else console.log("Success");
    });
    res.redirect("/");
  }
  else
  {
    List.findOneAndUpdate(
      {name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err) res.redirect("/" + listName);
      }
    );
  }
  
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
