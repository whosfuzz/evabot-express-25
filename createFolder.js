import { Client as AppwriteClient, Databases, Query, ID } from 'node-appwrite';
export async function execute(interaction, folder) 
{
  let response = "";
  try 
  {
      const databases = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

      if(folder.length > 20)
      {
        response = "Unable to add folder because maximum folder length is 20 characters";
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

     if(metaMessages.total != 0)
      {
        response = `Unable to create folder [${folder}] because it already exists\n\nUse "/list folders" to get a list of existing folders`;
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;
      }
    
    const createMetaMessage = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_METAMESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        folder: `${folder}`,
        count: 0
      },  
    );
      
      response = `Created folder [${folder}] successfully.\n\nUse "/create message ${folder}" to add a new message to the folder`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;
  } 
  catch (error) 
  {
      response = `An error occurred when trying to create the folder`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;
  }
}
