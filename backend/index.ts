import express from "express"
import { tavily } from "@tavily/core"
import { OpenRouter } from "@openrouter/sdk";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import { middleware } from "./middleware";
import cors from "cors"
import { prisma } from "./prisma/db";


const app = express();
const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const clientOpenRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

app.use(cors());
app.use(express.json())

function slugify(text: string) {
    const base = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "chat";
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}



// get Past Conversations
app.get('/conversations', middleware, async (req, res) => {
    const conversatoins = await prisma.conversation.findMany({
        where: {
            userId: req.userId
        },
        select: {
            id: true,
            slug: true,
            title: true
        }
    })
    res.json({ conversatoins });
})

// get Past Conversation
app.get('/conversation/:conversationId', middleware, async (req, res) => {
    const conversationId = req.params.conversationId as string;

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId: req.userId
        },
        include: {
            messages: { orderBy: { createdAt: "asc" } },
        },
    })

    if (!conversation) {
        res.status(400).json({
            message: "Conversation not found"
        });
        return;
    }

    res.json({ conversation })

})

app.post('/perplexity_ask', middleware, async (req, res) => {
    const query = req.body.query;

    // Web search
    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    })

    const webSearchResult = webSearchResponse.results

    // Create conversation with the user message
    const conversation = await prisma.conversation.create({
        data: {
            title: query.slice(0, 80),
            slug: slugify(query),
            userId: req.userId,
            messages: {
                create: { content: query, role: "User" }
            }
        }
    })

    // Hit the LLM and stream back the response
    const prompt = PROMPT_TEMPLATE
        .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResult))
        .replace("{{USER_QUERY}}", query)

    const response = await clientOpenRouter.chat.send({
        chatRequest: {
            model: 'openrouter/auto',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
            stream: true,
        }
    });

    let fullResponse = "";

    for await (const chunk of response) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
            fullResponse += content;
            res.write(content)
        }
    }

    // Save the AI response as a message
    await prisma.message.create({
        data: {
            content: fullResponse,
            role: "Assistance",
            conversatoinId: conversation.id
        }
    })

    // Stream back the sources
    res.write("\n<SOURCES>\n")
    res.write(JSON.stringify(webSearchResult.map(result => ({ url: result.url }))))
    res.write("\n</SOURCES>\n")

    res.end()
})

app.post('/perplexity_ask/followup', middleware, async (req, res) => {
    const { conversationId, query } = req.body;

    // Step 1 - get the existing chat from the db
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: req.userId },
        include: { messages: { orderBy: { createdAt: "asc" } } }
    })

    if (!conversation) {
        res.status(400).json({ message: "Conversation not found" });
        return;
    }

    // Save the new user message
    await prisma.message.create({
        data: {
            content: query,
            role: "User",
            conversatoinId: conversationId
        }
    })

    // Web search for follow-up context
    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    })
    const webSearchResult = webSearchResponse.results

    // Step 2 - build message history for LLM
    const history: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: SYSTEM_PROMPT }
    ];

    for (const msg of conversation.messages) {
        history.push({
            role: msg.role === "User" ? "user" : "assistant",
            content: msg.content
        })
    }

    // Step 2.5 - CONTEXT ENGINEERING: add web search + new query
    const prompt = PROMPT_TEMPLATE
        .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResult))
        .replace("{{USER_QUERY}}", query)

    history.push({ role: "user", content: prompt });

    // Step 3 - stream the response to the user
    const response = await clientOpenRouter.chat.send({
        chatRequest: {
            model: 'openrouter/auto',
            messages: history,
            stream: true,
        }
    });

    let fullResponse = "";

    for await (const chunk of response) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
            fullResponse += content;
            res.write(content)
        }
    }

    // Save the AI response
    await prisma.message.create({
        data: {
            content: fullResponse,
            role: "Assistance",
            conversatoinId: conversationId
        }
    })

    // Stream back the sources
    res.write("\n<SOURCES>\n")
    res.write(JSON.stringify(webSearchResult.map(result => ({ url: result.url }))))
    res.write("\n</SOURCES>\n")

    res.end()
})

// Delete a conversation (reset)
app.delete('/conversation/:conversationId', middleware, async (req, res) => {
    const conversationId = req.params.conversationId as string;

    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: req.userId }
    })

    if (!conversation) {
        res.status(400).json({ message: "Conversation not found" });
        return;
    }

    // Delete messages first, then the conversation
    await prisma.message.deleteMany({
        where: { conversatoinId: conversationId }
    })

    await prisma.conversation.delete({
        where: { id: conversationId }
    })

    res.json({ message: "Conversation deleted" })
})

app.listen(3001);

