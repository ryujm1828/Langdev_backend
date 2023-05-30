const nats = require('node-nats-streaming')
const logger = require('../log/logger');

module.exports = ()=>{
    const stan = nats.connect('cluster', 'game');
    
    stan.on('connect', () => {
        logger.info('connect nats')

        stan.on('close',()=>{
            logger.info('disconnect nats')
        })

        const options = stan
            .subscriptionOptions()
            .setManualAckMode(true)
            .setDeliverAllAvailable()
            .setDurableName("main-queue-group")
        
        const subscription = stan.subscribe(
            "main",
            "main-queue-group",
            options
        )

        // Simple Publisher (all publishes are async in the node version of the client)
        subscription.on("message", async (msg)=>{
            console.log(msg)
        })
       
    })
}