require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT;
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY,process.env.PINATA_SECRET_API);
const fs = require('fs');
const { ethers } = require("ethers");
//const chainId = process.env.chainId;
const proxy = process.env.proxy;
const nft = process.env.nft;
const signerPK = process.env.signerPK;
const provider = new ethers.providers.JsonRpcProvider(process.env.providerUrl);
const marketplace = require("./artifacts/Marketplace.json");
const nft_abi = require("./artifacts/NFT.json");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded())

// parse application/json
app.use(bodyParser.json())

//Middleware : check auth 
app.use(function (req, res, next) {
    pinata.testAuthentication().then((result) => {
        //handle successful authentication here
        console.log(result);
        next();
    }).catch((err) => {
        //handle error here
        console.log(err);
    });
  });


const upload_content =(name,file_name)=> {

    const readableStreamForFile = fs.createReadStream(`./storage/${file_name}`);
    // Only for testing purposes (reading local files)
    const options = {
        pinataMetadata: {
            name: name,
        },
        pinataOptions: {
            cidVersion: 0
        }
    };
    return new Promise(resolve => {
        pinata.pinFileToIPFS(readableStreamForFile, options).then((result) => {
            //handle results here
            console.log(result);
            resolve(result)
        }).catch((err) => {
            //handle error here
            console.log(err);
        });
    });
    
}

const pin_json =(description,cid,name)=> {
    const Json = {
        "description": `${description}`, 
        "image": `ipfs://${cid}`, 
        "name": `${name}`
      };
      
    const options = {
        pinataOptions: {
            cidVersion: 0
        },
        pinataMetadata: {
            name: `${name}.json`,
        }
    };
    return new Promise(resolve => {
    pinata.pinJSONToIPFS(Json, options).then((hash) => {
        //handle results here
        console.log(hash);
        resolve(hash)
    }).catch((err) => {
        //handle error here
        console.log(err);
    });
})
}


//pin content to ipfs & deploy NFT 
app.post('/api/deploy', async (req, res) => {
   
    //upload to IPFS Storage
    try{
    console.log(req.body)
    const {name,file_name,description,symbol,maxMintAmount,cost} = req.body;
    const cid = await upload_content(name,file_name);
    const BaseURI = await pin_json(description,cid,name);
    //Create NFT 
    const signer = new ethers.Wallet(signerPK, provider);
    const Proxy = new ethers.Contract(proxy, marketplace.abi, signer);
    const addr = await Proxy.deploy(name,symbol,BaseURI.IpfsHash,maxMintAmount,cost);
    res.status(200).json(addr); }
    catch {
        res.send('Something went wrong')
    } 
   


  })

//mint tokens 
app.post('/api/mint', async (req, res) => {
    try{
    const {nft_address,mint_amount} = req.body;
    const signer = new ethers.Wallet(signerPK, provider);
    const Proxy = new ethers.Contract(proxy, marketplace.abi, signer );
    const NFT = new ethers.Contract(nft, nft_abi.abi, signer);
    const cost = await NFT.cost();
    //mint
    const AmountTopay = cost*mint_amount
    const options = {value: ethers.utils.parseEther(`${AmountTopay}`)} 
    const mint = await Proxy.mint(nft_address,mint_amount,options);
    res.status(200).json(mint); }
    catch {
        res.send('something went wrong');
    }
    
  })

//List creator nfts 
app.get('/api/list', async (req, res) => {
    
    const {creator_address} = req.body;
    const Proxy = new ethers.Contract(proxy, marketplace.abi, provider);
    const result = await Proxy.getCreatorItems(creator_address);
    res.status(200).json(result);
    
  })
//List collector nfts  
app.get('/api/collection', async (req, res) => {

    const {collector_address} = req.body;
    const Proxy = new ethers.Contract(proxy, marketplace.abi, provider);
    const result = await Proxy.getCollectorItems(collector_address);
    res.status(200).json(result);
    

  })  
// server.js
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
