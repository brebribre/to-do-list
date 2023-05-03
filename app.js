//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3030;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose db 
mongoose.connect("mongodb+srv://alvinbryan78:test123@cluster0.lnlrf4e.mongodb.net/?retryWrites=true&w=majority");

//INITIALIZE ITEM
const itemsSchema = new mongoose.Schema({
  desc: {
    type: String,
  }
})
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  desc:'Item1'
})
const item2 = new Item({
  desc:'Item2'
})
const item3 = new Item({
  desc:'Item3'
})

const defaultItems = [item1, item2, item3];


//for custom lists
const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);

//LOAD MAIN PAGE
app.get("/", function(req, res) {
  Item.find().
        then(items => {
          if(items.length === 0){

            
            res.render("list", {listTitle: "Today", newListItems: items})
          }else{
            res.render("list", {listTitle: "Today", newListItems: items})
          }
        })
        .catch(function (err) {
          console.log(err);
        });
});


app.get("/:customListName", function(req,res){
  const listName = req.params.customListName;

  List.findOne({name: listName})
  .then(list => {
    if(list == null){
      console.log("List doesn't exist, creating new one...");
      const list = new List({
        name: listName,
        items: defaultItems
      })
      list.save();
      Item.insertMany(defaultItems)
                  .then(function () {
                    console.log("Successfully saved items to DB");
                  })
                  .catch(function (err) {
                    console.log(err);
                  });

      res.render("list", {listTitle: listName, newListItems: list.items})
    }else{
      //if already exist, load the said list
      console.log("Loading existing items..");
      res.render("list", {listTitle: listName, newListItems: list.items})
    }

  })
  .catch(function(err){
    console.log(err);
  })
})

//FOR RECEIVING REQUEST OF NEW ITEM
app.post("/", function(req, res){
  console.log(req.body);
  const listName = req.body.list;
  const itemName = req.body.newItem;

  const newItem = new Item({
    desc: itemName
  })
  //IF ITS IN THE MAIN ROUTE
  if(listName === "Today"){
    newItem.save();
    res.redirect('/');
  }else{//IF ITS IN A CUSTOM LIST

    List.findOne({name: listName})
    .then(foundList => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect('/'+listName);
    })

    .catch(function(err){
      console.log(err);
    })
  }

});

//CHECKBOX FUNCTIONALITY
app.post("/delete", function(req, res){
  const listName = req.body.listName;
  const itemId = req.body.checkBox;
  if(listName === 'Today'){
    Item.findByIdAndRemove(itemId).then(foundList => {
      console.log("Data deleted"); // Success
      res.redirect('/');
      
      
      
    }).catch(function(error){
        console.log(error); // Failure
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}})
    .then(function () {
      res.redirect('/' + listName);
    })
    .catch(function(err){
      console.log(err);
    })
  }


});


app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
