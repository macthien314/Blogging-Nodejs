var express = require('express');
var router = express.Router();

const ArticlelModel = require(__path_models + 'article');

const folderView     = __path_views_blog + 'pages/home/';
const layoutBlog     = __path_views_blog + 'frontend'; 
/* GET home page. */
router.get('/', async function(req, res, next) {
  let itemsSpecial = [];
  let itemsNews    = [];
  let itemsRandom   = res.locals.itemsRandom;
  // let itemsCategory   = [];

  
  await ArticlelModel.listItemsFrontend(null, {task: 'items-special'}).then((items) =>{
    itemsSpecial = items;
  })

  await ArticlelModel.listItemsFrontend(null, {task: 'items-news'}).then((items) =>{
    itemsNews = items;

  })




  res.render(`${folderView}index`, {
    layout: layoutBlog,
    top_post: true,
    itemsSpecial,
    itemsNews,

    // itemsCategory,
    
  });
  
});



module.exports = router;
