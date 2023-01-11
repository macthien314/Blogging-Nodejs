const ArticlelModel = require(__path_models + 'article');
module.exports = async (req, res, next) =>{
    await ArticlelModel.listItemsFrontend(null, {task: 'items-random'}).then((items) =>{
        res.locals.itemsRandom = items;
      })
       
    

    next();
}

