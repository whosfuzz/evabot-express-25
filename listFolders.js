import { Client as AppwriteClient, Databases, Query } from 'node-appwrite';

export async function execute(interaction, p) 
{
  let response = "";
  try 
  {
          const databases = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

    let page = parseInt(p);

    if (!Number.isInteger(page) || page < 1) 
    {
        response = "Not a valid page number";
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
    }
    
    const foldersPerPage = 50;

    const metaMessages = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_METAMESSAGES_COLLECTION_ID,
      [
        Query.limit(foldersPerPage),
        Query.offset((page - 1) * foldersPerPage),
        Query.orderAsc('folder')
      ]
    );
    
      if (metaMessages.total === 0) 
      {
        response = "No folders found. Use /create folder to get started";
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
      }
  
      const collections = metaMessages.documents;
      if(collections.length === 0)
      {
        const numOfPages = Math.ceil(metaMessages.total/foldersPerPage);
        if(numOfPages === 1)
        {
            response = `Not a valid page number. There is only ${numOfPages} page of folders`;
            await interaction.reply( {content: `${response}` , ephemeral: true});
            return;
        }
        else
        {
          response = `Not a valid page number. There are only ${numOfPages} pages of folders`;
          await interaction.reply( {content: `${response}` , ephemeral: true});
          return;
        }
      }
      
      let index = ((page - 1) * foldersPerPage) + 1;
      let totalCount = 0;
      collections.forEach(collection => {
        const fold = collection.folder; 
        const count = collection.count;
        totalCount += parseInt(count);
        response += `${index}. [${fold}] (${count})\n`;
        index++;
      });

      response += "--------------------\n";
      response += `Total folders: ${metaMessages.total}\n`;

      if((((page - 1) * foldersPerPage) + 1) === (index - 1))
      {
          response += `Showing results for page ${page}: ${index - 1} (${totalCount})\n`;
      }
      else
      {
          response += `Showing results for page ${page}: ${((page - 1) * foldersPerPage) + 1}-${index - 1} (${totalCount})\n`;
      }
      
      if((index - 1) === metaMessages.total)
      {
          response += "End of results";
      }
      else
      {
          response += `Use /list folders ${page + 1} to view results for page ${page + 1}`;
      }
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;

  } 
  catch (error) 
  {
      response = `An error occurred when trying to send the message`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;
  }
}
