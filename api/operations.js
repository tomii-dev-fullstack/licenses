const mysql = require("mysql")

 const Read =(con, callback) =>{
    
    con.query("select * from prod", function(err, result){
        if(err){
            console.log(err)

        }
        callback(result);
        
        
    }) 
}

const Insert = (con, callback)=> {
    con.query("insert into prod values('producto1')", function(err, result){
        if(err){
            console.log(err)

        }
        callback(result);
        
        
    })   }

module.exports = {Read, Insert}
/* module.exports = function Insert(con, callback){
    con.query("insert into prod values('producto1')", function(err, result){
        if(err){
            console.log(err)

        }
        callback(result);
        
        
    })
}
 */
 