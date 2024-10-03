import ollama from 'ollama'

console.log(await generateResponse())

async function generateResponse(messages = []) {
    return await ollama.chat({
        model: 'llama3.2',
        messages: [{ role: 'user', content: 'Why is the sky blue?' }],
    }).then(result => { return result.message.content }).catch(err => { console.error(err); return "Something went wrong with generating the response. an error log has been placed in the console of the bot." })
}