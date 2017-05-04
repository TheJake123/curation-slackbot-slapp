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
    var channel = channels[channelId]
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
	          },
	          {
                  "name": "post",
                  "text": "Share to channel...",
                  "type": "select",
                  "options": [
            		   {  
            		      "text":"Test",
            		      "value":1
            		   },
            		   {  
        			     "text":"Digital Marketing",
        			     "value":7
        			   },
        			   {  
        			      "text":"Legal",
        			      "value":40
        			   },
        			   {  
        			      "text":"Innovation & Startups",
        			      "value":43
        			   },
        			   {  
        			      "text":"Journalism",
        			      "value":66
        			   },
        			   {  
        			      "text":"Ondernemen",
        			      "value":76
        			   },
        			   {  
        			      "text":"Market Trends",
        			      "value":82
        			   },
        			   {  
        			      "text":"9x Awesome Content",
        			      "value":83
        			   },
        			   {  
        			      "text":"Business Practices",
        			      "value":84
        			   },
        			   {  
        			      "text":"Education Market",
        			      "value":86
        			   },
        			   {  
        			      "text":"Venture Capital & Startups",
        			      "value":87
        			   },
        			   {  
        			      "text":"Fintech",
        			      "value":89
        			   },
        			   {  
        			      "text":"Direct Marketing",
        			      "value":101
        			   },
        			   {  
        			      "text":"IT Business",
        			      "value":109
        			   },
        			   {  
        			      "text":"NN Algemeen",
        			      "value":116
        			   },
        			   {  
        			      "text":"Customer Insights",
        			      "value":120
        			   },
        			   {  
        			      "text":"CPS",
        			      "value":125
        			   },
        			   {  
        			      "text":"RMS",
        			      "value":126
        			   },
        			   {  
        			      "text":"IBM in the Media",
        			      "value":136
        			   },
        			   {  
        			      "text":"Randstad in the News",
        			      "value":151
        			   },
        			   {  
        			      "text":"Randstad Market Watch",
        			      "value":152
        			   },
        			   {  
        			      "text":"IBM Cloud Market Watch",
        			      "value":170
        			   },
        			   {  
        			      "text":"IBM Developer Advocates",
        			      "value":219
        			   },
        			   {  
        			      "text":"Achmea Transport",
        			      "value":250
        			   },
        			   {  
        			      "text":"Achmea Automotive",
        			      "value":251
        			   },
        			   {  
        			      "text":"Achmea Innovation",
        			      "value":253
        			   }
        			]
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
      })
    }
    if (req.body.companies) {
      fields.push({
        title: "Companies",
        short: false,
        value: req.body.companies
      })
    }
    if (req.body.word_count) {
      fields.push({
        title: "Length",
        short: true,
        value: req.body.word_count
      })
    }
    if (req.body.shares) {
      fields.push({
        title: "Shares",
        short: true,
        value: formatCount(req.body.shares)
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
          (err, response) => {
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
	if (!value) value = msg.body.actions.selected_options[0].value
    console.log(`Article ${msg.body.original_message.attachments[0].title_link} shared to channel ${value}`)
    var originalMsg = msg.body.original_message;
	var chosenAttachment = originalMsg.attachments[msg.body.attachment_id - 1];
	addUrlToChannel(value, msg.body.original_message.attachments[0].title_link)
		.then(() => {
			chosenAttachment.actions = []
			var lastAttachment = {
					pretext: `:postbox: Article posted to channel ${value}`
			}
			originalMsg.attachments = [chosenAttachment, lastAttachment]
			msg.respond(msg.body.response_url, originalMsg)
		})
		.catch((err) => {
			console.log(err)
			var lastAttachment = {
					pretext: `:exclamation: Error posting article to channel ${value}`
			}
			originalMsg.attachments = [chosenAttachment, lastAttachment]
			msg.respond(msg.body.response_url, originalMsg)
		})	
})

function addUrlToChannel(channelId, url) {
	return new Promise((resolve, reject) => {
		request.post('http://itao-server-55663464.eu-central-1.elb.amazonaws.com/itao/item/add/url',
			{body: url}, (err, res, body) => {
				if (err) return reject(err);
				if (!body.success) return reject(JSON.stringify(body));
				request.post('http://itao-server-55663464.eu-central-1.elb.amazonaws.com/itao/channel/item/add',
	    			{ json: {
	    				channel_id: channelId,
	    				url: url
	    			}}, (err2, res2, body2) => {
	    				if (err) return reject(err);
	    				if (!body.success) return reject(JSON.stringify(body));
	    				resolve();
			})
		})
	})
}

slapp.action('share', 'discard', (msg, value) => {
	var originalMsg = msg.body.original_message
	var chosenAttachment = originalMsg.attachments[msg.body.attachment_id - 1]
    chosenAttachment.actions = []
	var lastAttachment = {
		pretext: `:no_entry: Article discarded`,
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