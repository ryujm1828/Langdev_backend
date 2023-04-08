require('dotenv').config();

const {Configuration, OpenAIApi} = require("openai");

console.log("a");

const openaiconf = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(openaiconf);

const chatGPT = async (prompt) => {
    console.log("bb");
    const response = await openai.createCompletion({
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: prompt }],
    })
    console.log("b");
    //console.log(response["data"]["choices"][0]["message"]["content"]);
}

chatGPT("Hello?");