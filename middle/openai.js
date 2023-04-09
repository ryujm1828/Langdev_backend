require('dotenv').config();

const {Configuration, OpenAIApi} = require("openai");

const openaiconf = new Configuration({
    organization: prcoeess.env.OPENAI_ORGANIZATION,
    apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(openaiconf);

exports.chatGPT = async (prompt) => {
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
    });
    console.log(response.data.choices[0].message.content);
}

//chatGPT("Hello"); : chatGPT(입력) -> chatGPT의 답변 문자열로 반환