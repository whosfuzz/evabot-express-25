import { Client as AppwriteClient, Databases, Query } from 'node-appwrite';
export async function execute(interaction, query, p) 
{
  let response = "";
   try {
        const databases = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

        let page = parseInt(p);
      
        if (!Number.isInteger(page) || page < 1) {
            response = `Not a valid page number`;
            await interaction.reply( {content: `${response}` , ephemeral: true});
            return;
          }

        const messagesPerPage = 10;
      
        const result = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_MESSAGES_COLLECTION_ID,
            [
              Query.limit(messagesPerPage),
              Query.offset((page - 1) * messagesPerPage),
              Query.orderDesc('$createdAt'),
              Query.contains("message", `${query}`),
            ]
        );
     
        if (result.total === 0) {
          response = `No messages found with query "${query}"`;
          await interaction.reply( {content: `${response}` , ephemeral: true});
          return;
        }

        const documents = result.documents;
        if(documents.length === 0)
        {
            const numOfPages = Math.ceil(result.total/messagesPerPage);
            if(numOfPages === 1)
            {
              response = `Not a valid page number. There is only ${numOfPages} page that matches your query`;
              await interaction.reply( {content: `${response}` , ephemeral: true});
              return;
            }
            else
            {
              response = `Not a valid page number. There are only ${numOfPages} pages that match your query`;
              await interaction.reply( {content: `${response}` , ephemeral: true});
              return;
            }
        }
    
        let index = ((page - 1) * messagesPerPage) + 1;
        documents.forEach((document, currentIndex, array) => {
          if (currentIndex === array.length - 1) {
            response += "```" + document.$id + "```" + "<" + document.message + "> [" + document.folder + "]" + "\n";
          } else {
            response += "```" + document.$id + "```" + "<" + document.message + "> [" + document.folder + "]" + "\n\n";
          }
          index++;
        });


        response += "--------------------\n";
        response += `Total messages: ${result.total}\n`;

        if((((page - 1) * messagesPerPage) + 1) === (index - 1))
        {
            response += `Showing results for page ${page}: ${index - 1}\n`;
        }
        else
        {
            response += `Showing results for page ${page}: ${((page - 1) * messagesPerPage) + 1}-${index - 1}\n`;
        }
  
        if((index - 1) === result.total)
        {
            response += "End of results";
        }
        else
        {
            response += `Use /list search ${query} ${page + 1} to view results for page ${page + 1}`;
        }

        await interaction.reply( {content: `${response}` , ephemeral: true});
       return;

  } catch (error) {

      if(error.code === 404)
      {
        response = `Unable to list messages because no messages match your query`;
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
      }

     response = `An error occurred when trying to send the message`;
     await interaction.reply( {content: `${response}` , ephemeral: true});
     return;
  }
}
