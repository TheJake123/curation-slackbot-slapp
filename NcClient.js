const baseUrl = 'http://localhost:8889'//'http://dcos-stag-publicsl-hcawqpyewdvq-1292970214.eu-west-1.elb.amazonaws.com:10104'
const DEFAULT_LIMIT = 10
var request = require('request-promise-native')

class NcClient {
	
	constructor (apiKey) {
		this.apiKey = apiKey
	}
	
	list() {
		var options = {
		    method: 'GET',
		    uri: `${baseUrl}/feeds`,
		    json: true, // Automatically stringifies the body to JSON
		    headers: {
		    	Authorization: `Bearer ${this.apiKey}`
		    }
		}
		return request(options)		
	}
	
	create (name) {
		var options = {
		    method: 'POST',
		    uri: `${baseUrl}/feeds`,
		    body: {
		    	name,
		    	sources: []
		    },
		    json: true, // Automatically stringifies the body to JSON
		    headers: {
		    	Authorization: `Bearer ${this.apiKey}`
		    }
		}
		return request(options)
	}
	
	add (feedId, url) {
		var options = {
		    method: 'POST',
		    uri: `${baseUrl}/feeds/${feedId}/sources`,
		    body: {
		    	type:'rss',
		    	attributes: {
		    		url
		    	}
		    },
		    json: true, // Automatically stringifies the body to JSON
		    headers: {
		    	Authorization: `Bearer ${this.apiKey}`
		    }
		}
		return request(options)
	}
	
	listSources(feedId) {
		var options = {
		    method: 'GET',
		    uri: `${baseUrl}/feeds/${feedId}/sources`,
		    json: true, // Automatically stringifies the body to JSON
		    headers: {
		    	Authorization: `Bearer ${this.apiKey}`
		    }
		}
		return request(options)
	}

}

module.exports = NcClient