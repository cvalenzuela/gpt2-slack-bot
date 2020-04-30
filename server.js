// A GPT-2 Bot in Slack using RunwayML
// Check out the tutorial: https://medium.com/@cris_62635/creating-a-custom-gpt-2-slack-bot-with-runwaymls-hosted-models-c639fe135379

const { HostedModel } = require('@runwayml/hosted-models');
const { WebClient } = require("@slack/web-api");
const express = require("express");

const app = express();
const port = 5555;

// Make sure to update the SLACK_TOKEN in your .env file!
const web = new WebClient(process.env.SLACK_TOKEN);
// Add your own hosted model URL in the following line:
const model = new HostedModel({
  url: "https://gpt-2-57ea133e.hosted-models.runwayml.cloud/v1/",
  token: process.env.HOSTED_MODEL_TOKEN,
});

app.use(express.json());

app.post("/", async (req, res) => { 
  const body = req.body;
  // Use the following line to verify our server with Slack.
  // res.send(body.challenge); // IMPORTANT: Comment this out once the URL is verified in Slack!
  
  // --- Uncomment the lines 30-46 once your server is verified in Slack! ---
  // --- This is where we call our GPT-2 model! ---

  res.sendStatus(200); // Slack requires us to reply with a 200 status right after we get an incoming message
     const slackChannelId = body.event.channel; // Get the Slack channel ID
  // Get the status of the model. Hosted Models may go to sleep after 5 minutes if they are not used.
  const isAwake = await model.isAwake();

  // If the model is awake generate some text!
  if (isAwake) {
    postToSlack(body.event.text, slackChannelId);
  } else {
    // If the model is asleep, the status request above will make make it wake up! ☕️
    // We will reply to the user while the model is waking up
    await web.chat.postMessage({
      text:
        "Dave, I'm waking up. I'll be ready in 5, just getting my things together.",
      channel: slackChannelId
    });
  }

  // --- Uncomment the lines 30-46 once your server is verified in Slack! ---
});

// A function to make our model generate text based on the Slack prompt
const postToSlack = async (input, channel) => {
  // Let's remove the Bot name from the prompt
  const botName = "<@U0134JMV1L0>";
  const prompt = input.replace("<@U0134JMV1L0>", "").trim();

  // Let's query our model with the Slack prompt
  try {
    const { generated_text } = await model.query({
      prompt, // Our Slack prompt
      max_characters: 200, // The max amount of characters to generate
      top_p: 0.2, // A lower value leads to highier quality but less surprising results (values between 0 and 1)
      seed: Math.floor(Math.random() * 1000) // Change this number to generate different samples (values between 0 and 1000)
    });
    
    // Once we the generated text from our model, we can post it as a reply to Slack!
    await web.chat.postMessage({
      text: generated_text.replace(prompt, "").split(".")[0], // Let's break the text in the first period we encounter. Feel free to change this!
      channel: channel
    });
  } catch (e) {
    // In case something goes wrong
    await web.chat.postMessage({
      text: "I'm sorry Dave, I'm afraid I can't do that.",
      channel: channel
    });
  }
};

// Let's start our server!
const listener = app.listen(process.env.PORT, () => {
  console.log("Hal is listening on " + listener.address().port);
});
