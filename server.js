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
  console.log('Team added: ', message.resource.SlackTeamName);
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
    var verifiedIcon = req.body.verified ? "https://cdn3.iconfinder.com/data/icons/basicolor-arrows-checks/24/154_check_ok_sticker_success-512.png" : "http://www.clker.com/cliparts/H/Z/0/R/f/S/warning-icon-hi.png"
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
            		      "text":"1 - Test",
            		      "value":1
            		   },
            		   {  
        			     "text":"7 - Digital Marketing",
        			     "value":7
        			   },
        			   {  
        			      "text":"40 - Legal",
        			      "value":40
        			   },
        			   {  
        			      "text":"43 - Innovation & Startups",
        			      "value":43
        			   },
        			   {  
        			      "text":"66 - Journalism",
        			      "value":66
        			   },
        			   {  
        			      "text":"76 - Ondernemen",
        			      "value":76
        			   },
        			   {  
        			      "text":"82 - Market Trends",
        			      "value":82
        			   },
        			   {  
        			      "text":"83 - 9x Awesome Content",
        			      "value":83
        			   },
        			   {  
        			      "text":"84 - Business Practices",
        			      "value":84
        			   },
        			   {  
        			      "text":"86 - Education Market",
        			      "value":86
        			   },
        			   {  
        			      "text":"87 - Venture Capital & Startups",
        			      "value":87
        			   },
        			   {  
        			      "text":"89 - Fintech",
        			      "value":89
        			   },
        			   {  
        			      "text":"101 - Direct Marketing",
        			      "value":101
        			   },
        			   {  
        			      "text":"109 - IT Business",
        			      "value":109
        			   },
        			   {  
        			      "text":"116 - NN Algemeen",
        			      "value":116
        			   },
        			   {  
        			      "text":"120 - Customer Insights",
        			      "value":120
        			   },
        			   {  
        			      "text":"125 - CPS",
        			      "value":125
        			   },
        			   {  
        			      "text":"126 - RMS",
        			      "value":126
        			   },
        			   {  
        			      "text":"136 - IBM in the Media",
        			      "value":136
        			   },
        			   {  
        			      "text":"151 - Randstad in the News",
        			      "value":151
        			   },
        			   {  
        			      "text":"152 - Randstad Market Watch",
        			      "value":152
        			   },
        			   {  
        			      "text":"170 - IBM Cloud Market Watch",
        			      "value":170
        			   },
        			   {  
        			      "text":"219 - IBM Developer Advocates",
        			      "value":219
        			   },
        			   {  
        			      "text":"250 - Achmea Transport",
        			      "value":250
        			   },
        			   {  
        			      "text":"251 - Achmea Automotive",
        			      "value":251
        			   },
        			   {  
        			      "text":"253 - Achmea Innovation",
        			      "value":253
        			   }
        			]
              }
	        ]
    }
    if (req.body.host) {
      attachment.author_name = req.body.host;
      attachment.author_link = `http://${req.body.host}`;
    }
    if (req.body.summary) {
        attachment.text = req.body.summary
    }
    if (req.body.image_url) {
        attachment.image_url = req.body.image_url
    }
    if (req.body.pub_date) {
        attachment.ts = Date.parse(req.body.pub_date) / 1000
    }
    
    // Populating fields
    var fields = []
    if (req.body.keywords) {
    	if (!req.body.keywords.includes(", ")) {
    		req.body.keywords = req.body.keywords.replace(/,/g, ", ")
    	}
	    fields.push({
	    	title: "Keywords",
	    	short: false,
	    	value: req.body.keywords
	    })
    }
    if (req.body.companies) {
    	if (!req.body.companies.includes(", ")) {
    		req.body.companies = req.body.companies.replace(/,/g, ", ")
    	}
	    fields.push({
	        title: "Companies",
	        short: false,
	        value: req.body.companies
	    })
    }
    if (req.body.word_count) {
    	var length = req.body.word_count
    	var prefix = ""
    	if (length > 1000 )
    		prefix = ":snail: "
    	else if (length < 300)
    		prefix = ":fast_forward: "
    	fields.push({
    		title: "Length",
    		short: true,
    		value: `${prefix}${length} words`
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
    	var sentiment
    	switch (req.body.sentiment) {
    		case "negative":
    			sentiment = ":rage: Negative";
    			break;
    		case "positive":
    			sentiment = ":smile: Positive";
    			break;
    		case "neutral":
    			sentiment = "Neutral"
    			break;
    	}
    	fields.push({
            title: "Sentiment",
            short: true,
            value: sentiment
          })
    }
//    Unsupported for now
//    fields.push({
//    	"title": "Sponsored",
//        "value": ":warning: Undetected",
//        "short": true
//    })
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
	var sharedInChannel = true
	if (!value) {
		sharedInChannel = false
		value = msg.body.actions[0].selected_options[0].value
	}
	var url = msg.body.original_message.attachments[0].title_link
	var userId = msg.body.user.id
    var originalMsg = msg.body.original_message;
	var chosenAttachment = originalMsg.attachments[msg.body.attachment_id - 1]
	addUrlToChannel(value, url)
		.then(() => {
			var attachment = {
				color: '#006600',
				text: `${url}
:postbox: Article posted to channel ${value} by <@${userId}>`
			}
			originalMsg.attachments = [chosenAttachment]
			msg.respond(msg.body.response_url, originalMsg)
		})
		.catch((err) => {
			console.log(err)
			chosenAttachment.color = '#ff9933'
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
				try {
					JSON.parse(body)[0]
				} catch (err) {
					return reject(JSON.stringify(body));
				}
				request.post('http://itao-server-55663464.eu-central-1.elb.amazonaws.com/itao/channel/item/add',
	    			{ json: {
	    				channel_id: channelId,
	    				url: url
	    			}}, (err2, res2, body2) => {
	    				if (err2) return reject(err);
	    				try {
	    					var success = body2.success
	    					if (!success) return reject(JSON.stringify(body));
	    				} catch (err) {
	    					return reject(JSON.stringify(body));
	    				}
	    				resolve();
			})
		})
	})
}

slapp.action('share', 'discard', (msg, value) => {
	var originalMsg = msg.body.original_message
	var url = msg.body.original_message.attachments[0].title_link
	var userId = msg.body.user.id
	var chosenAttachment = originalMsg.attachments[msg.body.attachment_id - 1]
    chosenAttachment.actions = []
	var attachment = {
		color: '#800000',
		text: `${url}
:no_entry: Article discarded by <@${userId}>`,
	} 
	originalMsg.attachments = [attachment]
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
	var prefix = ""
	if (magnitude >= 6) {
		prefix = ":fire: "
		magnitude -= 6
		postfix = "M"
	} else if (magnitude >= 3) {
		magnitude -= 3
		postfix = "k"
	}
	var first_digit = String(x).charAt(0);
	var rounded_significant = first_digit >= 5 ? 5 : 1;
	return `${prefix}${rounded_significant * Math.pow(10, magnitude)}${postfix}+`
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