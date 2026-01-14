const express = require("express");
const router = express.Router();
const Group = require("../models/Group");

// GET all groups
router.get("/", async (req,res)=>{
  const groups = await Group.find();
  res.json(groups);
});

// POST create group
router.post("/", async (req,res)=>{
  const { name } = req.body;
  if(!name) return res.status(400).json({error:"Name required"});
  const group = new Group({ name });
  await group.save();
  res.json(group);
});

// PUT edit group
router.put("/:id", async (req,res)=>{
  const { name } = req.body;
  const group = await Group.findByIdAndUpdate(req.params.id, {name}, {new:true});
  res.json(group);
});

// DELETE group
router.delete("/:id", async (req,res)=>{
  await Group.findByIdAndDelete(req.params.id);
  res.json({message:"Deleted"});
});

module.exports = router;
