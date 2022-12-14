const { response } = require('express');
const bcrypt = require("bcrypt")
var express = require('express');
var multer = require('multer');
var router = express.Router();
var path = require('path');
console.log(path);
require.main.filename;
const PDFDIR = path.join(__dirname, '../public/pdfs/');
const IMGDIR = path.join(__dirname, '../public/images/');
const VIDDIR = path.join(__dirname, '../public/videos/');
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    if(file.fieldname == 'resume'){
      cb(null, PDFDIR);
    }else if(file.fieldname == 'profilepic'){
      cb(null, IMGDIR);
    }else{
      cb(null, VIDDIR);
    }},
    filename: function (req, file, cb){
      if(file.fieldname == 'resume' || file.fieldname == 'profilepic'){
        cb(null, file.originalname);
      }else{
        cb(null, file.originalname);
      }
    }
});
var upload = multer({storage: storage});
var app = express();
var user;
const saltRounds = 12;
var salt = bcrypt.genSaltSync(saltRounds);

router.get('/', (req, res) => {
  console.log("hello");
   res.send("hello");
   console.log(res);
});

// create new user
router.post('/userInfo', upload.fields(
  [
    {
      name:'resume',
      maxCount:1
    },
    {
      name:'projectvid',
      maxCount:1
    },
    {
      name:'profilepic',
      maxCount: 1
    }
  ]
), function(req, res) {
  console.log(req.body);   
  console.log(req.files);
  var skills = [];
  for(var i =0; i < req.body.skills.length; i++){
    skills.push(req.body.skills[i]);
  }
  console.log("SKILLS: "+ skills);
  user = {
    name: req.body.actualname,
    propic: req.files['profilepic'][0].filename,
    email: req.body.email,
    desc: req.body.about_me,
    userResume: req.files['resume'][0].filename,
    vid: req.files['projectvid'][0].filename,
    skillz: skills,
    addinfo: req.body.additionalinfo,
  };

  let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let userInfo = `INSERT INTO userInfo(actualname, username, email, about_me, additionalinfo) VALUES (?)`;
  let values = [
    req.body.actualname,
    req.body.email,
    req.body.email,
    req.body.about_me,
    req.body.additionalinfo
  ];
  db.query(userInfo, [values], function(err, data, fields) {
    if (err){
      throw err;   
    }else{
      console.log("userInfo insert success!")
    } 
});
  //save skills
  var skillsql = 'INSERT INTO skills(username, skill) VALUES (?)';
  for(var i = 0; i < req.body.skills.length; i++){
    let newSkill = req.body.skills[i];
    console.log("skill:" + newSkill);
    let skillvalues = [
      req.body.email,
      newSkill
    ];
    console.log("SKILLVALUES: "+ skillvalues);
    db.query(skillsql, [skillvalues], function(err, data, fields) {
      if (err){
        throw err;   
      }else{
        console.log("skills insert success!")
      } 
    });
  } 
  
  //save resume
  var resql = 'INSERT INTO `resumes`(`resume_location`, `username`, `date_added`) VALUES (?)';
  let resValues = [
    "/public/pdfs/"+req.files['resume'][0].filename,
    req.body.email,
    date
  ];
  db.query(resql, [resValues], function(err, data, fields) {
    if (err){
      throw err;   
    }else{
      console.log("resumes insert success!")
    } 
  });
  

  //save vid
  let vid = 'INSERT INTO videos(vid_location, username, date_added) VALUES (?)';
  let vidValues = [
    "/public/videos/"+req.files['projectvid'][0].filename,
    req.body.email,
    date
  ];
  db.query(vid, [vidValues], function(err, data, fields){
    if(err) throw err;
  });
    //save profile pic
    let pic = 'INSERT INTO pics(pic_location, username, date_added) VALUES (?)';
    let picValues = [
      "/public/images/" +req.files['profilepic'][0].filename,
      req.body.email,
      date
    ];
    db.query(pic, [picValues], function(err, data, fields){
      if(err) throw err;
      res.render('generated.ejs', {user: user});
    });
});

// create new questionaire
router.post('/submitQuestionaire', upload.none(), function(req, res) {
  console.log("in submit questionaire");
  let sql = `INSERT INTO answers(answer_1, answer_2, answer_3, answer_4, answer_5) VALUES (?)`;
    let values = [
      req.body.answer_1,
      req.body.answer_2,
      req.body.answer_3,
      req.body.answer_4,
      req.body.answer_5
    ];
    db.query(sql, [values], function(err, data, fields) {
      if (err) throw err;
      res.redirect('/');
    })
});

// create download css
router.get('/downloadCSS', function(req, res) {
  var cssFile = path.join(__dirname, '../public/stylesheets/generated.css');
  res.download(cssFile); // Set disposition and send it.
});

// create download css
router.get('/toQuestionaire', function(req, res) {
  res.redirect('/questionaire');
});

router.post('/createAccount', upload.none(), function(req, res) {
  console.log(req.body);
  let hash = bcrypt.hashSync(req.body.pass, salt);
  let values = [
    req.body.username,
    req.body.email,
    hash,
  ];
  let sql = `INSERT INTO createdUsers(username,email,pass) VALUES (?)`;
  db.query(sql, [values], function(err, data, fields) {
    if (err) throw err;
    res.redirect('/');
  })
});

router.get('/generated', (req, res) => {
  res.render("generated", {user:user});
});


router.post('/Auth', upload.none(), function(req, res) {
  console.log("authenticating user info...");
  var username = req.body.loginUsername;
  var password = req.body.loginPassword;
  console.log("username: "+ username +"\nplaintext pass: "+req.body.loginPassword);
  if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		db.query('SELECT pass FROM createdUsers WHERE username = ?', username, function(error, result, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (result.length > 0) {
        if(res.headersSent){
          console.log("headers sent");
        }
        bcrypt.compare(password, result[0].pass, function(err, r){
          if(res.headersSent){
            console.log("headers sent");
          }
          if(r){
            // put session variables here if we get time
            // Redirect to home page
            console.log("Yay password is true - in bcrypt compare - redirecting to index");
            res.redirect('/index');
          }else{
            //res.send('Incorrect Username and/or Password!');
            res.redirect('/login');
          }
        });
      }else{
        //res.send('Incorrect Username and/or Password!');
        res.redirect('/login');
      }
    });
  }else{
    //res.send('Incorrect Username and/or Password!');
    res.redirect('/login');
  }     
});

module.exports = router;
