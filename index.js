const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');

// Connect to MongoDB
mongoose.connect("mongodb+srv://amaadhav938:5rc3UFqyzvsqyEqT@cluster0.ovydhlv.mongodb.net/garam-phanchayat", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/images', express.static('./upload/images'));

// Multer setup
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(null, `${file.originalname}_${Date.now()}`);
  }
});
const upload = multer({ storage: storage });

// User Schema

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  mobile: String,
  isAdmin: String,
  staff: String
});

const User = mongoose.model('User', userSchema);

app.post("/signup", async (req, res) => {
  const { name, email, password, mobile, isAdmin, staff } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedIsAdmin = isAdmin ? await bcrypt.hash(isAdmin, salt) : "";
    const hashedStaff = staff ? await bcrypt.hash(staff, salt) : "";

    const user = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      isAdmin: hashedIsAdmin,
      staff: hashedStaff,
    });

    await user.save();

    const tokenData = { user: { id: user._id } };
    const token = jwt.sign(tokenData, 'secret_ecom', { expiresIn: '1h' });

    res.json({ success: true, token, name: user.name, isAdmin: user.isAdmin, staff: user.staff,id:user._id });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});
// Login route
app.post("/login", async (req, res) => {
  const { email, password,staff,isAdmin } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    const isMatch1 = await bcrypt.compare(isAdmin, user.isAdmin);
    const isMatch2 = await bcrypt.compare(staff, user.staff)
   
    if (!isMatch || !isMatch1 || !isMatch2) {
      return res.status(400).json({ error: "Password not matched" });
    }

    const tokenData = { user: { id: user._id } };
    const token = jwt.sign(tokenData, 'secret_ecom', { expiresIn: '1h' });

    res.json({ success: true, token, name: user.name, isAdmin: user.isAdmin ,staff:user.staff,id:user._id});
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const fetchuser=(req,res,next)=>{
    const token=req.header('auth-token');
    if(!token){
        res.status(401).send({error:"please authenticate using a valid token"})
    }
    try{
        const user=jwt.verify(token,'secert_ecom');
        req.user=user.id;
        next();
    }
    catch(e){
        res.status(401).send({error:"please authenticate using a valid token"})
    }
}
//schema module
const image=new mongoose.Schema({image_url:String})
const Offer= new mongoose.Schema({
  user:mongoose.Schema.Types.ObjectId,
    name:String,
    price:Number,
    image:String,
    description:String,
    category:String,

})
const Schema= mongoose.model('Schema', Offer);
app.post("/addoffer",async(req,res)=>{
    

    const offer=new Schema({
        user:req.body.user,
        name:req.body.name,
        price:req.body.price,
        image:req.body.image,
        description:req.body.description,
        category:req.body.category
    });
    await offer.save();
    res.send("offer saved")
})
app.get("/getoffer",async(req,res)=>{
    res.send(await Schema.find())})
app.delete("/deleteoffer/:id",async(req,res)=>{
    await Schema.findByIdAndDelete(req.params.id);
    res.send("offer deleted")})
app.put("/updateoffer/:id",async(req,res)=>{
    await Schema.findByIdAndUpdate(req.params.id,req.body);
    res.send("offer updated")})
app.get("/getoffer/:id",async(req,res)=>{
    res.send(await Schema.findById(req.params.id))})
app.get("pkl/:category",async(req,res)=>{
    res.send(await Schema.find({category:req.params.category}))})
app.get("/getofferbysearch/:search",fetchuser,async(req,res)=>{
    res.send(await Schema.find({name:{$regex:req.params.search}}))})
const application=new mongoose.Schema({
    user:mongoose.Schema.Types.ObjectId,
    image:image,
    name:String,
    email:String,
    phone:String,
    adhar:String,
    address:String,
    price:Number,
    paymentid:String,
    status:{type:Boolean ,default:false},
    course:String,
    
})
const Application=new mongoose.model("Application",application);
app.post("/application",async(req,res)=>{
    const application=new Application({
        user:req.body.user,
        // image:req.body.image,
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        adhar:req.body.adhar,
        address:req.body.address,
        // price:req.body.price,
        paymentid:req.body.paymentid,
        status:req.body.status,
        course:req.body.course
    });
    await application.save();
    res.send("application saved")})
app.get("/getapplication/:id",fetchuser,async(req,res)=>{
    res.send(await Application.findById(req.params.id))})
app.get("/getapplication",async(req,res)=>{
    res.send(await Application.find())

})
app.delete("/deleteapplication/:id",fetchuser,async(req,res)=>{
    await Application.findByIdAndDelete(req.params.id);
    res.send("application deleted")
})
app.put("/approve/:id",async(req,res)=>{
    
    await Application.findByIdAndUpdate(req.params.id,req.body);
    res.send("application updated")         
  
})


// app.listen(8000,()=>console.log("server is running")); //server is running on port 8000
// Start the server
app.listen(8000, () => console.log("Server is running on port 8000"));
