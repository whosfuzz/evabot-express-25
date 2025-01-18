import { Client as AppwriteClient, Databases, Query } from 'node-appwrite';
export async function execute(interaction, folder) 
{
  let response = "";
  try {
      const databases = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

      if(folder.length > 20)
      {
        response = "Unable to delete folder because maximum folder length is 20 characters";
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
      }

      const metaMessages = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_METAMESSAGES_COLLECTION_ID,
            [
              Query.offset(0),
              Query.limit(1),
              Query.equal("folder", [`${folder}`])
            ]
      );

     if(metaMessages.total === 0)
      {
        response = `Unable to delete folder [${folder}] because it doesn't exist\n\nUse "/list folders" to get a list of existing folders`;
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
      }

        const messages = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_MESSAGES_COLLECTION_ID,
            [
              Query.offset(0),
              Query.limit(5000),
              Query.equal("folder", [`${folder}`])
            ]
      );

      for (const message of messages.documents) {
        await databases.deleteDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_MESSAGES_COLLECTION_ID,
          message.$id
        );
      }


     const deleteMeta = await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_METAMESSAGES_COLLECTION_ID,
      metaMessages.documents[0].$id, // documentId
    );
    
        response = `Deleted folder [${folder}] successfully`;
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
  }
  catch (error) 
  {
      if(error.code === 404)
      {
          response = `Unable to delete [${folder}] because the folder doesn't exist. Please ensure you've entered the folder name correctly\n\nUse "/list folders" to get a list of available folders`;
          await interaction.reply( {content: `${response}` , ephemeral: true});
          return;
      }

      response = `An error occurred when trying to delete`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;

  }
}
