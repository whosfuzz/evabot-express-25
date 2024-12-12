import { Client as AppwriteClient, Databases, Query, ID } from 'node-appwrite';
export async function execute(interaction, folder, message) 
{
    let response = "";
    try {
        const databases = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

      let m = message;
      let f = folder;
    
      if(f.length > 20)
      {
          response = "Unable to add message because maximum folder length is 20 characters";
          await interaction.reply( {content: `${response}` , ephemeral: true});
          return;
      }

      if(m.length > 150)
      {
          response = "Unable to add message because maximum message length is 150 characters";
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
        response = `Unable to create message because folder [${f}] doesn't exist. Please ensure you've entered the folder name correctly\n\nUse "/create folder ${f}" to add it to the list of available folders`;
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
      }

    const regularMessages = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_MESSAGES_COLLECTION_ID,
        [
            Query.offset(0),
            Query.limit(1),
            Query.equal("folder", [`${folder}`])
        ]
      );

      if(regularMessages.total === 5000)
      {
        response = `Unable to create message because the maximum number of messages in one folder is 5000`;
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
      }


    const documentData = { message: m, folder: f, seen: false };
    
    const createMessage = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MESSAGES_COLLECTION_ID,
      ID.unique(),
      documentData,
    );
    
    
    const updateMeta = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_METAMESSAGES_COLLECTION_ID,
      metaMessages.documents[0].$id, // documentId
      {
          folder: f,
          count: (metaMessages.documents[0].count + 1)
      }, 
    );

      response = `Added '${m}' to [${f}] successfully.`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;

  } catch (error) {
      response = `An error occurred when trying to create the message.`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;
  }
}
