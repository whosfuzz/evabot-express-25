export async function execute(interaction, message) 
{
    try {
        if(message.length <= 2000)
        {
            await interaction.deferReply();
            await interaction.deleteReply();
            await interaction.channel.send(message);
        }
        else
        {
          let response = "";
          response = "Unable to send message because maximum message length is 2000 characters";
          await interaction.reply( {content: `${response}` , ephemeral: true});
        }
        return;

  } catch (error) {
      let response = "";
      response = `An error occurred when trying to echo the message.`;
      await interaction.reply( {content: `${response}` , ephemeral: true});
      return;
  }
}
