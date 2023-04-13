require('dotenv').config();

const {Configuration, OpenAIApi} = require("openai");

const openaiconf = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(openaiconf);

async function chatGPT(prompt,callback) {
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
    });
    const result = response.data.choices[0].message.content
    console.log(`${result}`);
    callback(result);
}

module.exports = chatGPT;

//chatGPT("Hello"); : chatGPT(입력) -> chatGPT의 답변 문자열로 반환