const express = require('express');
const request = require('request-promise');
const bodyParser = require('body-parser');

class easyline {
	constructor(token,option = {}){
		this.app = express();
		this.token = token;
		this.messageEvent = [];
		Object.assign(this,{
			port:option.port||44321
		});
		this.app.use(bodyParser.urlencoded({ extended: false }));
		this.app.use(bodyParser.json());

		this.app.post('/webhook',(req,res,next)=>{
			res.status(200).end();
			req.body.events.forEach((event)=>{
				var reqHandler = {
					reply:(text)=>{
						return this.send(text,event.source.userId)
					},
					getTime:()=>{
						return new Date(event.timestamp + 32400000)
					},
				}
				switch(event.type){
					case 'message':
						this.execMessage(event.message.text,reqHandler);
				}
			})
		})
		this.app.listen(this.port);
		this.header = {
			'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.token
		}
	}
	message(regex,fn){
		this.messageEvent.push({
			reg:new RegExp(regex),
			fn
		})
	}
	execMessage(text,handler){
		this.messageEvent.find(e=>{
			if(e.reg.test(text)){
				return e.fn(handler)
			}
		})
	}
	send(text,userId){
		var param = {
            url: 'https://api.line.me/v2/bot/message/push',
            method: 'POST',
            headers: this.header,
            body: {
				messages:[{
					text,
					type:'text',
				}],
				to:userId
            },
            json: true
        }
		return request(param)
	}
	prompt(generator,firstSelector){
		var gen = generator();
		this.messageEvent.push({
			reg:firstSelector,
			fn:function _(mes,handler){
					var ret = gen.next(mes);
					if(ret.done){return}
					this.messageEvent.push({
						reg:ret.value,
						fn:_
					})
					return true;
				}
			})
		})
	}
}

module.exports = easyline