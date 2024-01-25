const mongoose=require('mongoose')
const ETLSchema=mongoose.Schema({
    fromAddress: String,
    maxPriorityFeePerGas: Number,
    amount: Number,
    status: Number,
    gasLimit: Number,
    gasPrice: Number,
    maxFeePerGas: Number,
    id: String,
    toAddress: String,
    blockNumber: Number,
    timestamp: Date,
    nonce: Number,
    gasUsed: Number
})
const etl = mongoose.model('etl', ETLSchema);

module.exports = etl;