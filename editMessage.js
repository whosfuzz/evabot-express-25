import { Client as AppwriteClient, Databases } from 'node-appwrite';

export async function execute(interaction, id, m) 
{
  let response = "";
  try {
      const databases = new Databases(new AppwriteClient().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));

      if(m.length > 150)
      {
          response = "Unable to edit message because maximum message length is 150 characters";
          await interaction.reply( {content: `${response}` , ephemeral: true});
          return;
      }

      const getDocument = await databases.getDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_MESSAGES_COLLECTION_ID,
            id
      );

        const result = await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_MESSAGES_COLLECTION_ID,
            id,
            {folder: getDocument.folder, message: m, seen: false}, // data (optional)
        );
        response = `Edited message with id "${id}" to '${m}' successfully`;
        await interaction.reply( {content: `${response}` , ephemeral: true});
        return;

  }
  catch (error) 
  {
      if(error.code === 404)
      {
          if(error.type === "document_not_found")
          {
              response = `Unable to edit the message with id "${id}" because there is no message with the specified id. Please ensure you've entered the id correctly\n\nUse "/list messages" to get a list of messages with their corresponding id in the specified folder`;
              await interaction.reply( {content: `${response}` , ephemeral: true});
              return;
          }
      }
    
      response = `An error occurred when trying to edit`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;
  }
}
