const express = require ("express");
const dotenv = require("dotenv");
const { google } = require("googleapis");


require('dotenv').config();
const app = express();
app.use(express.json());

const Client = new google.auth.OAuth2( //oAuth2Client
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
)

// google login 
app.get("/", (req,res) => {          
    res.send(           
        `<p> Go to <a href ="/auth/gmail">/auth/gmail</a></p>`
    );                        
})       
app.get("/auth/gmail", (req,res)=>{
    const url = Client.generateAuthUrl({
        access_type : "offline",     //generate fresh token
        scope : ["https://www.googleapis.com/auth/gmail.readonly"],
    });
    res.redirect(url);   //redirected to the authentication page
    //after authentication, redirected to the website joki save kiye hai env file me
})  
 app.get("/callback" , async(req,res)=>{
    const { code } = req.query;
    const { tokens } = await Client.getToken(code);
    Client.setCredentials(tokens);
    res.send("Gmail Connected!! You can now fetch emails.");
})

app.get("/gmail", async(req,res)=>{
    const gmail = google.gmail({version : "v1", auth : Client});
    const result = await gmail.users.messages.list({ userId : "me" , maxResults : 5});

    const mails = [];
    for ( let msg of result.data.messages){
        const fullMsg = await gmail.users.messages.get({userId : "me" , id: msg.id});
        const headers = fullMsg.data.payload.headers;
        const subject = headers.find( h => h.name === "Subject")?.value|| "No Subject";
        const from = headers.find( h => h.name === "From")?.value || "unknown";
        mails.push({
            id : msg.id,
            source : "gmail",
            title : subject,
            content : fullMsg.data.snippet,
            date : fullMsg.data.internalDate,
            from,
        });
    }
    res.json(mails);

})

app.listen(3000, ()=>{
    console.log(`http://localhost:3000`);
})



