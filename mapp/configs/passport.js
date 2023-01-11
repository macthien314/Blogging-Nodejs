var LocalStrategy = require('passport-local');
const UsersModel = require(__path_models + 'users');
var md5 = require('md5');
const notify         = require(__path_configs + 'notify');
module.exports = function(passport){

    passport.use(new LocalStrategy(function verify(username, password, cb) {
        UsersModel.getItemByUsername(username, null).then((users)=>{
            console.log('123123',users)
            let user = users[0];
            console.log('1',user)
    
            if (user == undefined || user.lenth == 0) {
                console.log('không tồn tại')
                 return cb(null, false, { message: notify.ERROR_LOGIN }) 
                }
            else {
    
                if(md5(password) !== user.password )
                {
                    console.log(md5(password));
                    console.log('không đúng')
                    return cb(null, false, { message: notify.ERROR_LOGIN  })
                }
                else{
                    console.log('ok');
                    return cb(null, user)
                }
       
            }
        })
    
      }));
    
      passport.serializeUser(function(user, done){
        done(null, user._id);
      });
    
      passport.deserializeUser(function(id, done){
        UsersModel.getUser(id, null).then((user) =>{
            done(null,user);
        });
      });
    
}
