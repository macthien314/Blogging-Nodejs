var express = require('express');
var router = express.Router();
const folderView     = __path_views_blog + 'pages/category/';
const layoutBlog     = __path_views_blog + 'frontend'; 

const ParamsHelpers = require(__path_helpers + 'params');

const ArticlelModel = require(__path_models + 'article');
const CategorylModel = require(__path_models + 'category');


/* GET home page. */
router.get('/:id', async function(req, res, next) {
  let idCategory      = ParamsHelpers.getParam(req.params, 'id', '');
  let itemsInCategory = [];


  await ArticlelModel.listItemsFrontend({id: idCategory}, {task: 'items-in-category'}).then((items) =>{
    itemsInCategory = items;
  })


  res.render(`${folderView}index`, {
    layout: layoutBlog,
    top_post: false,
    itemsInCategory,

  });
});



module.exports = router;
