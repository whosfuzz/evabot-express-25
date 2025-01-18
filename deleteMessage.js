import { Client as AppwriteClient, Databases, Query } from 'node-appwrite';
export async function execute(interaction, id) 
{
  let response = "";
  try {
      const databases = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

    if(id.length > 36)
    {
          response = "Unable to delete message because the specified id doesn't exist";
          await interaction.reply( {content: `${response}` , ephemeral: true});
          return;
    }
    
    const getDocument = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_MESSAGES_COLLECTION_ID,
          id
    );

        const deleteDocument = await databases.deleteDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_MESSAGES_COLLECTION_ID,
            id
        );

          const metaMessages = await databases.listDocuments(
              process.env.APPWRITE_DATABASE_ID,
              process.env.APPWRITE_METAMESSAGES_COLLECTION_ID,
              [
                  Query.offset(0),
                  Query.limit(1),
                  Query.equal("folder", [`${getDocument.folder}`])
              ]
        );

          if(metaMessages.total > 0)
          {
              const updateMeta = await databases.updateDocument(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_METAMESSAGES_COLLECTION_ID,
                metaMessages.documents[0].$id, // documentId
                {
                    folder: getDocument.folder,
                    count: (metaMessages.documents[0].count - 1)
                }, 
              );
          }
    
    
        response = `Deleted message with id "${id}" successfully`;
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;

    
  }
  catch (error) 
  {
      if(error.code === 404)
      {
          if(error.type === "document_not_found")
          {
              response = `Unable to delete the message with id "${id}" because there is no message with the specified id. Please ensure you've entered the id correctly\n\nUse "/list messages" to get a list of messages with their corresponding id in the specified folder`;
              await interaction.reply( {content: `${response}` , ephemeral: true});
              return;
          }
      }

      response = `An error occurred when trying to delete`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;
  }
}
