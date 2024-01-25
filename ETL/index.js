const express = require('express');
const axios = require('axios');
const mongoose=require('mongoose');
const app = express();
const PORT = 3000;
app.use(express.json());
const etl=require("./Model");
mongoose
  .connect("mongodb://127.0.0.1:27017/etl", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

let etldata=[]

let a = new Set();
async function fetchData(){
    const response= await fetch ('https://api.dapplooker.com/chart/87596cde-e5df-4a5d-9e72-7592d4861513?api_key=4721550ec26a47cabbf1aa0609ab7de3&output_format=json');
    const data= await response.json();

    for(const entry of data){
        etldata.push(entry)
    }
    console.log(etldata)
   etldata.forEach(async(entry)=>{
    try{
          const e=  etl({
            fromAddress: entry['From Address'],
            maxPriorityFeePerGas: entry['Max Priority Fee Per Gas'],
            amount: entry['Amount'],
            status: entry['Status'],
            gasLimit: entry['Gas Limit'],
            gasPrice: entry['Gas Price'],
            maxFeePerGas: entry['Max Fee Per Gas'],
            id: entry['ID'],
            toAddress: entry['To Address'],
            blockNumber: entry['Block Number'],
            timestamp: entry['Timestamp'],
            nonce: entry['Nonce'],
            gasUsed: entry['Gas Used']
          })
           await e.save();
    }
     catch (error) {
        console.error('Error saving document:', error);
      }
   })
}
 const fetchdb= async()=>{
    const response=await etl.find();
   return response;
 }
 fetchdb();
// Assuming gasPrices is an array of objects with 'date' and 'price' properties
const calculateAverage = (gasPrices) =>
{
    const i=gasPrices.length
    const totalGasPrices = gasPrices.reduce((sum, entry) => sum + (entry.gasPrice)/i, 0);
    const averageGasPrice = totalGasPrices ;
    return averageGasPrice;
};
const isValidTable = (entityDefinition) => {
    return (
    entityDefinition.fields !== null &&
    entityDefinition.fields !== "" &&
    entityDefinition.fields !== undefined &&
    entityDefinition.fields.length > 0 &&
    !['your', 'entities', 'to', 'exclude'].includes(entityDefinition.name.toLowerCase()) &&
    !entityDefinition.name.startsWith("_")
    );
    };


// Assuming blocks is an array of objects representing blocks
const extractBlockDetails = (blocks) =>
{      
    console.log(blocks)
    const blockDetails = blocks.map((block) => ({
        Timestamp : block.timestamp,
        AverageGasPrice : block.gasPrice,
        NumberOfTransactions : block.nonce,
    }));

    return blockDetails;
};

// Assuming blocks is an array of objects representing blocks and blockNumber is the input parameter
const getBlockInfo =async (bNumber) =>
{     const {blockNumber}=bNumber
    try {
        const blockData = await etl.find({ blockNumber: parseInt(blockNumber) }).exec()
        return blockData;
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    
};
const getBlockTransactions =async (bNumber) =>
{     
    try {
        const blockData = await etl.find({ blockNumber: parseInt(bNumber) }).exec()
        return blockData;
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    
};

// GET API to get all tables
app.get(
    '/api/tables', async(req, res) => {
    try {
        const response =  await axios.get('https://gist.githubusercontent.com/realchoubey/25132ad140df2fffd683db85650e0847/raw/f5bc65516829a183820db2ee010abaedddbcd65e/json-schema.json ');
        const data =  response.data;
    
        if (data && data.__schema) {
            const validTables = data.__schema.types.filter(
                entityDefinition =>
                    entityDefinition.fields !== null &&
                    entityDefinition.fields !== '' &&
                    entityDefinition.fields !== undefined &&
                    entityDefinition.fields.length > 0 &&
                    !['exclude1', 'exclude2'].includes(entityDefinition.name.toLowerCase()) &&
                    !entityDefinition.name.startsWith('_')
            );
    
            console.log(validTables);
    
            res.status(200).json({
                validTables
            });
        } else {
            console.error("Invalid data structure. Ensure that 'data.__schema.types' is defined.");
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
    });

// 2. GET API to return average gas price of the day hogaya'
let averageGasCost=[];
app.get(
    '/api/averageGasPrice', async(req, res) => {
       
        try
        {
        const response= await fetchdb();
        response.forEach((entry)=>{
            a.add(entry.blockNumber)
        })
         for(const item of a){
            const blockInfo = await getBlockTransactions(item);
            const averageGasPrice = calculateAverage(blockInfo);
            averageGasCost.push({
                blockNumber:item,
                averageGasPrice:averageGasPrice
            })
         }
            

            res.json({averageGasCost});
        }
        catch (error)
        {
            console.error(error);
            res.status(500).json({error : 'Internal Server Error'});
        }
    });


// 4. GET API to get block details
app.get(
    '/api/blockDetails', async(req, res) => {
        try
        {
            const response= await fetchdb();
            const blockDetails = extractBlockDetails(response);

            res.json({blockDetails});
        }
        catch (error)
        {
            console.error(error);
            res.status(500).json({error : 'Internal Server Error'});
        }
    });

// 5. GET API to take the input as block number and return its timestamp and number of transactions
app.get(
    '/api/blockDetail', async(req, res) => {
        try
        {
            const blockNumber = req.body;
            const response= await fetchdb();
            const blockInfo = await getBlockInfo(blockNumber);
            res.json({
                numberOfTransactions:blockInfo.length,
                TimeStamp:blockInfo[0].timestamp,
                blockInfo
            });
        }
        catch (error)
        {
            console.error(error);
            res.status(500).json({error : 'Internal Server Error'});
        }
    });

    console.log(a)
    let transactions=[];
    app.get('/api/transactions',async(req,res)=>{
        try{
            const addelements= await fetchdb();
            addelements.forEach((entry)=>{
                a.add(entry.blockNumber)
            })
            for(const item of a){
                const blockInfo = await getBlockTransactions(item);
                console.log(item,blockInfo.length)
                transactions.push({
                    blockNumber:item,
                    no_of_transactions:blockInfo.length
                })
            }
            res.json({transactions})
        }
        catch(err){
            console.log(err);
        }
    });

    
    // Assuming the 'transformData' function is already defined for transforming data
const transformData = async() => {
    const response = await fetchdb();
    const modifiedArray = response.slice(0, 10).map(entry => {
        delete entry['maxPriorityFeePerGas'],
        delete entry['status'],
        delete entry['maxFeePerGas'],
        delete entry['nonce'],
        delete entry['gasUsed']
       return entry
})
    return modifiedArray;
};

app.get('/api/transformStructure', async (req, res) => {
    try {
        const transformedData =await transformData();
        res.json({ transformedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});






    
    
    app.listen(
        PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });