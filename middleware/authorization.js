import jwt from "jsonwebtoken";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if(token == null)
    return res.status(401).json({Error : "Invalid or null token"});
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user)=>{
        if(error)
            return res.status(403).json({Error : error.message});
        req.user = user;
        next();    
    });
}

export { authenticateToken };
