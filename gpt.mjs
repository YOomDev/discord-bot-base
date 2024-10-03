import ollama from 'ollama'

const MODEL = 'llama3.2';

const ROLES = {
    SYSTEM: 'system',
    USER:   'user',
    GPT:    'assistant'
}

async function generateResponse(messages = [{ role: ROLES.USER, content: 'Why is the sky blue?' }]) {
    return await ollama.chat({
        model: MODEL,
        messages: messages,
    }).then(result => { return result }).catch(err => { console.error(err); return { message: { content: "Something went wrong with generating the response. an error log has been placed in the console of the bot." } } })
}