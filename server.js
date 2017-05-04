'use strict'
const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
const BeepBoop = require('beepboop')
const bodyParser = require('body-parser')
const parameters = require('parameters-middleware');
var request = require('request')
const slackey = require('slackey')
// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000
var channels = {}

var slackAPIClient 
var beepboop = BeepBoop.start()

beepboop.on('open', () => {
  console.log('connection to Beep Boop server opened')
})
beepboop.on('error', (error) => {
  console.log('Error from Beep Boop connection: ', err)
})
beepboop.on('close', (code, message) => {
  console.log('Connection to Beep Boop was closed')
})
beepboop.on('add_resource', (message) => {
  console.log('Team added: ', message);
  console.log(message.resource.SlackBotAccessToken);
  slackAPIClient = slackey.getAPIClient(message.resource.SlackBotAccessToken);
	fetchChannels();
})
var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})
var app = express()
app.use(bodyParser.json());
app.post('/recommendations',
  parameters({body : ["channel", "title", "url"]}),
  (req, res) => {
    var channelId = req.body.channel
    var channel = '#general'//channels[channelId]
    if (channel == null) return res.status(400).send("Channel not found")
    var verifiedIcon = req.body.verified ? "http://smallbusiness.support/wp-content/uploads/2015/10/facebook-verified.png" : "https://cdn1.iconfinder.com/data/icons/rounded-flat-country-flag-collection-1/2000/_Unknown.png"
    var attachment = {
    	callback_id: "share",
	      author_icon: verifiedIcon,
	      title_link: req.body.url,
	      title: req.body.title,
	      actions: [
	          {
	            "name": "post",
	            "text": "Post",
	            "type": "button",
	            "style": "primary",
	            "value": channelId
	          },
	          {
	            "name": "discard",
	            "text": "Discard",
	            "type": "button",
	            "style": "danger",
	            "value": "discarded"
	          }
	        ]
    }
    if (req.body.host) {
      attachment.author_name = req.body.host
        attachment.author_link = req.body.host
    }
    if (req.body.summary) {
        attachment.text = req.body.summary
    }
    if (req.body.image_url) {
        attachment.image_url = req.body.image_url
    }
    if (req.body.pub_date) {
        attachment.ts = Date.parse(req.body.pub_date)
    }
    
    // Populating fields
    var fields = []
    if (req.body.keywords) {
      fields.push({
        title: "Keywords",
        short: false,
        value: req.body.keywords
          .map(elem => {
              return elem.keyword;
          }).join(", ")
      })
    }
    if (req.body.companies) {
      fields.push({
        title: "Companies",
        short: false,
        value: req.body.companies
          .map(elem => {
              return elem.text;
          }).join(", ")
      })
    }
    if (req.body.word_count) {
      fields.push({
        title: "Length",
        short: true,
        value: req.body.word_count
      })
    }
    if (req.body.engagement) {
      fields.push({
        title: "Shares",
        short: true,
        value: formatCount(req.body.engagement)
      })
    }
    if (req.body.sentiment) {
    	fields.push({
            title: "Sentiment",
            short: true,
            value: req.body.sentiment
          })
    }
    fields.push({
    	"title": "Sponsored",
        "value": ":warning: Undetected",
        "short": true
    })
    attachment.fields = fields
    slackAPIClient.send('chat.postMessage',
          {
          channel,
          attachments: [attachment]
          },
          function(err, response) {
          if (err) {
            console.log(err)
            res.status(500).send(err)
          } else {
            res.status(201).send(response)
          }

          }
        )
  }
)

slapp.action('share', 'post', (msg, value) => {
    console.log(`Article ${msg.body.original_message.attachments[0].title_link} shared to channel ${value}`)
	var originalMsg = msg.body.original_message
	var chosenAttachment = originalMsg.attachments[msg.body.attachment_id - 1]
    chosenAttachment.actions = []
	var lastAttachment = {
		pretext: `:postbox: Article posted to channel ${value}`,
	} 
	originalMsg.attachments = [chosenAttachment, lastAttachment]
	msg.respond(msg.body.response_url, originalMsg)
})

function fetchChannels() {
  slackAPIClient.send('channels.list',
      function(err, response) {
        if (err) console.log(err)
          for (var i = 0; i < response.channels.length; i++) {
            var channel = response.channels[i]
            try {
              var channelNumber = channel.name.split("-")[0]
              if (!isNaN(channelNumber)) {
                channels[channelNumber] = channel.id
              }
            } catch (err) {
              console.log(err)
            }
          }
        console.log(`${Object.keys(channels).length} channels loaded`)
        }
  )
}

function formatCount(x) {
  var magnitude = Math.max(Math.floor(Math.log10(Math.abs(x))), 0);
  var postfix = ""
  if (magnitude >= 6) {
    magnitude -= 6
    postfix = "M"
  } else if (magnitude >= 3) {
    magnitude -= 3
    postfix = "k"
  }
  var first_digit = String(x).charAt(0);
  var rounded_significant = first_digit >= 5 ? 5 : 1;
  return String(rounded_significant * Math.pow(10, magnitude)) + postfix + "+"
}

// attach Slapp to express server
var server = slapp.attachToExpress(app)
// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening on port ${port}`)
})
