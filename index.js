/*
import dotenv from 'dotenv'
dotenv.config()
*/
import cron from 'node-cron';

import { Client, Events, GatewayIntentBits, ActivityType } from 'discord.js';
import { Client as AppwriteClient, Databases, Query } from 'node-appwrite';
import { getRandomImage } from './imageUtils.js';
import { getRandomBlueskyImage } from './blueskyUtils.js';

import * as createMessage from './createMessage.js';
import * as createFolder from './createFolder.js';
import * as editMessage from './editMessage.js';
import * as deleteMessage from './deleteMessage.js';
import * as deleteFolder from './deleteFolder.js';
import * as listFolders from './listFolders.js';
import * as listMessages from './listMessages.js';
import * as listSearch from './listSearch.js';
import * as echoMessage from './echoMessage.js';

import express from 'express';

const app = express()
const port = process.env.PORT || 3000

let client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildPresences
    ],
  });

let streamingMessages = {};

//  console.log('Task runs at 5:30 AM Mountain Time');
cron.schedule('30 5 * * *', () => {
  streamingMessages = {};
}, {
  timezone: 'America/Denver'
});

async function handleInteraction(interaction) {

    try{

    if(!interaction.isCommand()) 
    {
        return;
    }   
    const db = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

    const { commandName, options } = interaction;
    if(commandName === 'echo')
    {
        if(options.getSubcommand() === 'message')
        {
            if(options.getString("message"))
            {
                await echoMessage.execute(interaction, options.getString("message"));  
            }
            else
            {
                 try {
                    let lastMessageSent = await db.getDocument(
                        process.env.APPWRITE_DATABASE_ID,
                        process.env.APPWRITE_LASTMESSAGES_COLLECTION_ID,
                        process.env.APPWRITE_LASTMESSAGES_DOCUMENT_ID
                    );
                
                    if (lastMessageSent.lastMessageId) {
                        try {
                            const doesLastMessageSentExist = await db.getDocument(
                                process.env.APPWRITE_DATABASE_ID,
                                process.env.APPWRITE_MESSAGES_COLLECTION_ID,
                                lastMessageSent.lastMessageId
                            );
                
                            await interaction.reply({
                                content: "```" + lastMessageSent.lastMessageId + "```" + lastMessageSent.lastMessage,
                                ephemeral: true
                            });
                
                        } catch (fetchError) {
                            await interaction.reply({
                                content: `This message has been deleted`,
                                ephemeral: true
                            });
                        }
                    } else {
                        await interaction.reply({
                            content: `This message has been deleted`,
                            ephemeral: true
                        });
                    }
                } catch (error) {
                    await interaction.reply({
                        content: `An error occurred when trying to echo the last message's id.`,
                        ephemeral: true
                    });
                }

            }
        }
    }
    else if(commandName === 'create')
    {
        if(options._hoistedOptions.length == 1)
        {
            await createFolder.execute(interaction, options.getString("folder").trim().toLowerCase());
        }
        else if(options._hoistedOptions.length == 2)
        {
            await createMessage.execute(interaction, options.getString("folder").trim().toLowerCase(), options.getString("message"));
        }
    }
    else if(commandName === 'edit')
    {
        if(options._hoistedOptions.length === 2)
        {
            if(options.getString("id"))
            {
                await editMessage.execute(interaction, options.getString("id"), options.getString("message"));
            }
        }
    }
    else if(commandName === 'list')
    {
        if(options._hoistedOptions.length == 1)
        {
            await listFolders.execute(interaction, options.getString("page"));
        }
        else if(options._hoistedOptions.length == 2)
        {
            if(options.getString("query"))
            {
                await listSearch.execute(interaction, options.getString("query").trim().toLowerCase(), options.getString("page"));
            }
            else
            {
                await listMessages.execute(interaction, options.getString("folder").trim().toLowerCase(), options.getString("page"));
            }
        }
    }
    else if(commandName === 'delete')
    {
        if(options._hoistedOptions.length == 1)
        {
            if(options.getString("folder"))
            {
                await deleteFolder.execute(interaction, options.getString("folder").trim().toLowerCase());
            }
            else
            {
                await deleteMessage.execute(interaction, options.getString("id"));
            }
        }
    }
    }
    catch(error)
    {
        await interaction.reply({
            content: `I can't show that!`,
            ephemeral: true
        });
    }
}

async function evaFunction(channel, folder, iterations = 0) {
    let response = "";
    
    try {
        const db = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

        let result = await db.listDocuments(process.env.APPWRITE_DATABASE_ID, process.env.APPWRITE_MESSAGES_COLLECTION_ID, [ Query.limit(5000), Query.offset(0), Query.equal("folder", [`${folder}`]) ]);
                
        if (result.total === 0) 
        {
            return 0;
        }
    
        const documents = result.documents;
        if (documents.length === 1) {
            documents[0].seen = false;
        }
        const seenDocuments = documents.filter(doc => doc.seen);
        const unseenDocuments = documents.filter(doc => !doc.seen);
    
        let randomDocumentMessage = "I can't show that!";
        let randomDocumentId = "undefined";
        
        if(unseenDocuments.length >= 1)
        {
            const randomIndex = Math.floor(Math.random() * unseenDocuments.length);
            const randomDocument = unseenDocuments[randomIndex];
    
            const updateDoc = await db.updateDocument(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_MESSAGES_COLLECTION_ID,
                randomDocument.$id, 
                { seen: true }
            );
    
            randomDocumentMessage = randomDocument.message;
            randomDocumentId = randomDocument.$id;
        }
    
        if (unseenDocuments.length <= 1) {
            const updatePromises = seenDocuments.map(async (doc) => {
                const updateDoc2 = await db.updateDocument(
                    process.env.APPWRITE_DATABASE_ID,
                    process.env.APPWRITE_MESSAGES_COLLECTION_ID,
                    doc.$id, 
                    { seen: false }
                );
            });
    
            await Promise.all(updatePromises);
        }

        if(randomDocumentId != "undefined" && randomDocumentMessage != "I can't show that!")
        {
            const updateLastMessageId = await db.updateDocument(
                process.env.APPWRITE_DATABASE_ID, 
                process.env.APPWRITE_LASTMESSAGES_COLLECTION_ID, 
                process.env.APPWRITE_LASTMESSAGES_DOCUMENT_ID,
                { lastMessageId: randomDocumentId, lastMessage: randomDocumentMessage}, 
            );
        }
        
        response = `${randomDocumentMessage}`;
        if(response.startsWith('+'))
        {                
            const commandQuery = response.slice(1).trim();
            if(commandQuery.length > 0)
            {
                try {
                    response = await getRandomImage(commandQuery);
                } catch (error) {
                    response = "I can't show that!";
                }
            }
            await channel.send(`${response}`);
            return 1;
        }
        else if(response.startsWith('-'))
        {
            const commandQuery = response.slice(1).trim();
            if(commandQuery.length > 0)
            {
                try {
                    response = await getRandomImage(commandQuery, 'off');
                } catch (error) {
                   response = "I can't show that!";
                }
            }
            await channel.send(`${response}`);
            return 2;
        }
        else if(response.startsWith('~'))
        {
            const folderName = response.slice(1).trim();
            if(folderName.length > 0)
            {
                if(iterations >= 3)
                {
                    response = `Too many redirections. This is due to a folder which contains a message that points to another folder which contains a message that points to another folder...`;
                    await channel.send(`${response}`);
                    return 4;
                }
                else
                {
                    const iterationResult = await evaFunction(channel, folderName, iterations + 1);

                    if(iterationResult === 0)
                    {
                        try {
                            const response = await getRandomImage(folderName);
                            await channel.send(`${response}`);
                        } catch (error) {
                                await channel.send("I can't show that!");
                        }
                    }
                }
            }
            else
            {
                await channel.send(`${response}`);
            }
        }
        else if(response.startsWith('!'))
        {                
            const commandQuery = response.slice(1).trim();
            if(commandQuery.length > 0)
            {
                try {
                    response = await getRandomBlueskyImage(commandQuery);
                } catch (error) {
                    response = "I can't show that!";
                }
            }
            await channel.send(`${response}`);
            return 5;
        }
        else
        {
            await channel.send(`${response}`);
            return 6;
        }
    }
    catch(error) {
        return 0;
    }
}


async function reset()
{    
    
    client.on(Events.MessageCreate, async message => { 
        if (message.author.bot) return;

        if (message.content.toLowerCase().includes('show me an ') || 
            message.content.toLowerCase().includes('show me the ')) {
        
            const split = message.content.toLowerCase().split(/show me an |show me the /);
        
            if (split.length > 1) {
                const searchTerm = split[1].trim();
                if (searchTerm.length > 0) {
                    const result = await evaFunction(message.channel, searchTerm);
                    
                    if (result === 0) {
                        try {
                            const response = await getRandomImage(searchTerm);
                            await message.channel.send(`${response}`);
                        } catch (error) {
                            await message.channel.send("I can't show that!");
                        }
                    }
                }
            }
        }
        else if(message.content.toLowerCase().includes('show me a '))
        {
            const split = message.content.toLowerCase().split(/show me a /);
        
            if (split.length > 1) {
                const searchTerm = split[1].trim();

                if (searchTerm.length > 0) {
                    const result = await evaFunction(message.channel, searchTerm);
                    
                    if (result === 0) {
                        try {
                            const response = await getRandomImage(searchTerm);
                            await message.channel.send(`${response}`);
                        } catch (error) {
                            await message.channel.send("I can't show that!");
                        }
                    }
                    
                }
            }
        }
        else if (message.content.toLowerCase().includes('show me ')) {
        
            const split = message.content.toLowerCase().split(/show me /);
        
            if (split.length > 1) {
                const searchTerm = split[1].trim();
                if (searchTerm.length > 0) {
                    const result = await evaFunction(message.channel, searchTerm);
                    
                    if (result === 0) {
                        try {
                            const response = await getRandomImage(searchTerm);
                            await message.channel.send(`${response}`);
                        } catch (error) {
                            await message.channel.send("I can't show that!");
                        }
                    }
                }
            }
        }
        else if(message.content.toLowerCase().startsWith('+'))
        {
            const commandQuery = message.content.toLowerCase().slice(1).trim();
            if(commandQuery.length > 0)
            {
                try {
                    const response = await getRandomImage(commandQuery);
                    await message.channel.send(`${response}`);
                } catch (error) {
                    await message.channel.send("I can't show that!");
                }
            }
        }
        else if(message.content.toLowerCase().startsWith('-'))
        {
            const commandQuery = message.content.toLowerCase().slice(1).trim();
            if(commandQuery.length > 0)
            {
                try {
                    const response = await getRandomImage(commandQuery, 'off');
                    await message.channel.send(`${response}`);
                } catch (error) {
                    await message.channel.send("I can't show that!");
                }
            }
        }
        else if(message.content.toLowerCase().startsWith('~'))
        {

            const folderName = message.content.toLowerCase().slice(1).trim();
            if(folderName.length > 0)
            {
                const result = await evaFunction(message.channel, folderName);
                if(result === 0)
                {
                    try {
                        const response = await getRandomImage(folderName);
                        await message.channel.send(`${response}`);
                    } catch (error) {
                            await message.channel.send("I can't show that!");
                    }
                }
            }
        }
        else if(message.content.toLowerCase().startsWith('!'))
        {
            const commandQuery = message.content.toLowerCase().slice(1).trim();
            if(commandQuery.length > 0)
            {
                try {
                    const response = await getRandomBlueskyImage(commandQuery);
                    await message.channel.send(`${response}`);
                } catch (error) {
                    await message.channel.send("I can't show that!");
                }
            }
        }
        else if(message.content.toLowerCase().includes('eva'))
        {
            const evaMessage = await evaFunction(message.channel, "eva");
        }
    });
        
        client.on(Events.InteractionCreate, async interaction => {
            if(!interaction.isCommand()) 
            {
                return;
            }
        
            await handleInteraction(interaction);
        });
    
        client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
          try {
            const user = newPresence.user;
            const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
        
            if (!newPresence.guild || newPresence.guild.id !== guild.id) return;
            if (user.bot) return;

            const member = await guild.members.fetch(user.id);
            const channel = await guild.channels.fetch(process.env.DISCORD_CHANNEL_ID);
        
            if (!channel || !channel.isTextBased()) return;
        
            // Use optional chaining for newPresence and activities
            const newActivity = newPresence?.activities?.find(
              (a) => a.type === ActivityType.Streaming
            );
        
            // Check if oldPresence is null before accessing activities
            const oldActivity = oldPresence?.activities?.find(
              (a) => a.type === ActivityType.Streaming
            );
        
            const userId = user.id;
        
            // Check if newActivity exists
            if (newActivity && !oldActivity) {
              const activityState = newActivity.state ? ` ${newActivity.state}` : '';
              const activityDetails = newActivity.details ? ` ${newActivity.details}` : '';
              const activityName = newActivity.name ? ` on ${newActivity.name}` : '';
              const activityUrl = newActivity.url ? ` ${newActivity.url}` : '';

              const messageToSend = `${member.displayName} is streaming${activityState}${activityDetails}${activityName}${activityUrl}`;

              if(streamingMessages[userId] !== messageToSend)
              {
                  streamingMessages[userId] = messageToSend;
                  await channel.send(messageToSend);
              }
            } 
          } catch (error) {
            console.error("Error in presenceUpdate:", error);
          }
    });

    
    await client.login(process.env.DISCORD_TOKEN);    
}

await reset();


app.get('/', (req, res) => {
    res.json(streamingMessages);
});

app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
});
